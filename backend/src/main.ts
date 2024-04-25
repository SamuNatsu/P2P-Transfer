/// Main entry
import type ws from 'ws';

import express from 'express';
import expressWs from 'express-ws';

// Create application
const app: express.Application = express();

// Create websocket wrapper
const appWs: expressWs.Instance = expressWs(app);

appWs.app.ws('/ws', (ws: ws.WebSocket): void => {
  console.log(ws);
});

// Start listening
appWs.app.listen(3000, (): void => {
  console.log('Server start listening on port 3000');
});
