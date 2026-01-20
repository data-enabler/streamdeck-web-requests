# streamdeck-web-requests
An Elgato Stream Deck plugin for sending web requests.

## Installation
Grab the .streamDeckPlugin file from the [releases](https://github.com/data-enabler/streamdeck-web-requests/releases/latest) page.

## Development
- Pre-requisites: [Stream Deck CLI](https://docs.elgato.com/streamdeck/cli/intro/), [Inkscape](https://inkscape.org/)
- Run the `render_images.ps1` script with Powershell or Bash to generate images
- `streamdeck link Sources/gg.datagram.web-requests.sdPlugin`
- `streamdeck restart gg.datagram.web-requests`

## Testing
- Install `test/WebRequestsTest.streamDeckProfile`
- `npm ci --prefix test`
- `node test`
- Verify that each action in the profile works when pressed
