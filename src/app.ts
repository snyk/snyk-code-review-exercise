import * as express from 'express';
import { getPackage } from './package';

/**
 * Bootstrap the application framework
 */
export function createApp(): express.Express {
  const app = express();

  app.use(express.json());

  app.get('/package/:name/:version', getPackage);

  return app;
}
