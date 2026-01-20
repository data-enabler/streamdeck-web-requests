import expect from 'expect';
import express from 'express';
import auth from 'http-auth';
import utils from 'http-auth/src/auth/utils.js';
import { WebSocketServer } from 'ws';

const HTTP_PORT = +(process.env.HTTP_PORT || 3000);
const WS_PORT_BASE = HTTP_PORT + 1;

const app = express();
app.use(express.json());
app.use(express.text());
/** @type {import('ws').WebSocketServer[]} */
const wsServers = [];

/**
 * @type {Record<string, () => void>}
 */
const tests = {
  'testGet': () => {
    app.get('/testGet', (req, res) => {
      res.sendStatus(200);
      console.log('GET request received');
    });
  },

  'testHead': () => {
    app.head('/testHead', (req, res) => {
      res.sendStatus(200);
      console.log('HEAD request received');
    });
  },

  'testDelete': () => {
    app.delete('/testDelete', (req, res) => {
      res.sendStatus(200);
      console.log('DELETE request received');
    });
  },

  'testPost': () => {
    app.post('/testPost', (req, res) => {
      expect(typeof req.body).toBe('object');
      res.sendStatus(200);
      console.log('POST request received');
    });
  },

  'testPut': () => {
    app.put('/testPut', (req, res) => {
      expect(typeof req.body).toBe('object');
      res.sendStatus(200);
      console.log('PUT request received');
    });
  },

  'testPatch': () => {
    app.patch('/testPatch', (req, res) => {
      expect(typeof req.body).toBe('object');
      res.sendStatus(200);
      console.log('PATCH request received');
    });
  },

  'testJson': () => {
    app.post('/testJson', (req, res) => {
      expect(req.body).toHaveProperty('foo', 'bar');
      res.sendStatus(200);
      console.log('Request received with JSON body:', req.body);
    });
  },

  'testText': () => {
    app.post('/testText', (req, res) => {
      expect(req.body).toBe('foobar');
      res.sendStatus(200);
      console.log('Request received with TEXT body:', req.body);
    });
  },

  'testQueryParams': () => {
    app.get('/testQueryParams', (req, res) => {
      expect(req.query).toHaveProperty('queryParam', 'foobar');
      res.sendStatus(200);
      console.log('Request with query params received:', req.query);
    });
  },

  'testContentType': () => {
    app.post('/testContentType', (req, res) => {
      // read Content-Type header
      const contentType = req.headers['content-type'];
      expect(contentType).toBe('application/json');
      res.sendStatus(200);
      console.log('Content-Type header received:', contentType);
    });
  },

  'testHeaders': () => {
    app.get('/testHeaders', (req, res) => {
      expect(req.headers).toHaveProperty('x-custom-header', 'foobar');
      res.sendStatus(200);
      console.log('Request with headers received:', req.headers);
    });
  },

  'testBasicAuth': () => {
    const basic = auth.basic({ realm: 'Basic Realm' }, (username, password, cb) => {
      cb(username === 'user' && password === 'pass');
    });
    app.get('/testBasicAuth', basic.check((req, res) => {
      res.statusCode = 200;
      res.end()
      console.log('Basic auth success for user:', req.user);
    }));
  },

  'testDigestAuth': () => {
    const digest = auth.digest({ realm: 'Digest Realm' }, (username, cb) => {
      if (username === 'user') {
        return cb(utils.md5(`${username}:Digest Realm:pass`));
      } else {
        return cb();
      }
    });
    app.get('/testDigestAuth', digest.check((req, res) => {
      res.statusCode = 200;
      res.end()
      console.log('Digest auth success for user:', req.user);
    }));
  },

  'testWebSocketRequest': () => {
    const wss = new WebSocketServer({ port: WS_PORT_BASE });
    wss.on('connection', socket => {
      socket.on('message', (message) => {
        console.log('WebSocket message received:', message.toString());
      });
    });
    wsServers.push(wss);
  },

  'testWebSocketData': () => {
    const wss = new WebSocketServer({ port: WS_PORT_BASE + 1 });
    wss.on('connection', socket => {
      socket.on('message', (message) => {
        const data = JSON.parse(message.toString());
        expect(data).toHaveProperty('foo', 'bar');
        console.log('WebSocket received:', message.toString());
      });
    });
    wsServers.push(wss);
  },
}

Object.entries(tests).forEach(([_name, setup]) => setup());
const httpServer = app.listen(
  HTTP_PORT,
  () => console.log(`HTTP test server listening on ${HTTP_PORT}`),
);

// graceful shutdown for developer runs
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  httpServer.close();
  wsServers.forEach((s) => s.close());
  process.exit(0);
});
