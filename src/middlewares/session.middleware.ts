import cookieSession from 'cookie-session';
import { envConfig } from '../config/env.config';
import { Express } from 'express';

export const applySessionMiddleware = (app: Express): void => {
  app.set('trust proxy', 1);
  app.use(
    cookieSession({
      name: 'session',
      keys: [envConfig.SECRET_KEY_ONE, envConfig.SECRET_KEY_TWO],
      maxAge: 24 * 7 * 3600000,
    })
  );
};
