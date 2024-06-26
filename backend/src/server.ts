/// Server module
import compression from 'compression';
import express from 'express';
import fs from 'fs';
import helmet from 'helmet';
import http from 'http';
import https from 'https';
import { Namespace, Server } from 'socket.io';

import { Logger } from '@/logger';

// Load TLS config
let tls: boolean = false;
let tlsMinVer: https.ServerOptions['minVersion'];
let tlsMaxVer: https.ServerOptions['maxVersion'];
let tlsCert: string;
let tlsKey: string;
if (process.env.TLS === 'on') {
  try {
    tls = true;
    tlsMinVer = process.env.TLS_MIN_VER as https.ServerOptions['minVersion'];
    tlsMaxVer = process.env.TLS_MAX_VER as https.ServerOptions['maxVersion'];
    tlsCert = fs.readFileSync(process.env.TLS_CERT!, 'utf-8');
    tlsKey = fs.readFileSync(process.env.TLS_KEY!, 'utf-8');
  } catch (err: unknown) {
    Logger.error(`[HTTP] Fail to load TLS config:\n${err}`);
    process.exit(1);
  }

  Logger.info(`[HTTP] TLS enabled: min=${tlsMinVer}, max=${tlsMaxVer}`);
}

// Create application
export const app: express.Application = express();

// Create HTTP(S) server
export const httpServer: http.Server = tls
  ? https.createServer(
      {
        cert: tlsCert!,
        key: tlsKey!,
        minVersion: tlsMinVer,
        maxVersion: tlsMaxVer
      },
      app
    )
  : http.createServer(app);

// Create Socket.IO server
const wsServer: Server = new Server(httpServer, {
  path: '/ws',
  serveClient: false
});

// Create namespaces
export const senderNsp: Namespace = wsServer.of('/sender');
export const receiverNsp: Namespace = wsServer.of('/receiver');

// Use default middlewares
app
  .use(compression())
  .use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'script-src': [
            "'self'",
            "'sha256-uk/nysP2R9cLUyOA92YsgEyomGCZC2iZ76cB9/WV2uo='"
          ]
        }
      }
    })
  )
  .use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ): void => {
      // Check simple authorization
      if (
        process.env.AUTH !== undefined &&
        req.headers['authorization'] !== process.env.AUTH
      ) {
        Logger.warn(
          `[HTTP] Unauthorized: auth=${req.headers['authorization']}`
        );

        res.end();
        return;
      }

      // Next
      Logger.trace(`[HTTP] ${req.method} ${req.path}`);
      next();
    }
  );
