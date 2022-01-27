$SD.on('connected', (jsonObj) => connected(jsonObj));

function connected(jsn) {
    $SD.on('gg.datagram.web-requests.http.keyDown', (jsonObj) => sendHttp(jsonObj));
    $SD.on('gg.datagram.web-requests.websocket.keyDown', (jsonObj) => sendWebSocket(jsonObj));
};

/**
 * @param {{
 *   context: string,
 *   payload: {
 *     settings: {
 *       url?: string,
 *       method?: string,
 *       body?: string|null,
 *     }
 *   },
 * }} data
 */
function sendHttp(data) {
    const { url, method, contentType, headers, body } = data.payload.settings;
    log('sendHttp', { url, method, contentType, headers, body });

    let defaultHeaders = {
      'Content-Type': contentType
    };
    let inputHeaders = {};

    if (typeof headers !== 'undefined') {
      const headersArray = headers.split(/\n/);

      for (let i = 0; i < headersArray.length; i += 1) {
        const [headerItem, headerItemValue] = headersArray[i].split(';');

        const updatedHeader = Object.assign(inputHeaders, {
          [headerItem]: headerItemValue
        });
        inputHeaders = updatedHeader;
      }
    }

    const fullHeaders = {
      ...defaultHeaders,
      ...inputHeaders
    }

    log(fullHeaders);

    if (!url || !method) {
        showAlert(data.context);
        return;
    }
    fetch(
        url,
        {
            cache: 'no-cache',
            method,
            body: ['GET', 'HEAD'].includes(method) ? undefined : body,
        })
        .then(checkResponseStatus)
        .then(() => showOk(data.context))
        .catch(err => {
            showAlert(data.context);
            logErr(err);
        });
}

/**
 * @param {{
 *   context: string,
 *   payload: {
 *     settings: {
 *       url?: string,
 *       body?: string|null,
 *     }
 *   },
 * }} data
 */
function sendWebSocket(data) {
    const { url, body } = data.payload.settings;
    log('sendWebSocket', { url, body });
    if (!url || !body) {
        showAlert(data.context);
        return;
    }
    const ws = new WebSocket(url);
    ws.onerror = err => {
        showAlert(data.context);
        logErr(new Error('WebSocket error occurred'));
    };
    ws.onclose = function(evt) { onClose(this, evt); };
    ws.onopen = function() {
        onOpen(this);
        ws.send(body);
        ws.close();
        showOk(data.context);
    };
}

/**
 * @param {void | Response} resp
 * @returns {Promise<Response>}
 */
async function checkResponseStatus(resp) {
    if (!resp) {
        throw new Error();
    }
    if (!resp.ok) {
        throw new Error(`${resp.status}: ${resp.statusText}\n${await resp.text()}`);
    }
    return resp;
}

/**
 * @param {WebSocket} ws
 */
function onOpen(ws) {
    log(`Connection to ${ws.url} opened`);
}

/**
 * @param {WebSocket} ws
 * @param {CloseEvent} evt
 */
function onClose(ws, evt) {
    log(`Connection to ${ws.url} closed:`, evt.code, evt.reason);
}

/**
 * @param {string} context
 */
function showOk(context) {
    $SD.api.showOk(context);
}

/**
 * @param {string} context
 */
function showAlert(context) {
    $SD.api.showAlert(context);
}

/**
 * @param {...unknown} msg
 */
function log(...msg) {
    console.log(...msg);
    $SD.api.logMessage(msg.map(stringify).join(' '));
}

/**
 * @param {...unknown} msg
 */
function logErr(...msg) {
    console.error(...msg);
    $SD.api.logMessage(msg.map(stringify).join(' '));
}

/**
 * @param {unknown} input
 * @returns {string}
 */
function stringify(input) {
    if (typeof input !== 'object' || input instanceof Error) {
        return input.toString();
    }
    return JSON.stringify(input, null, 2);
}
