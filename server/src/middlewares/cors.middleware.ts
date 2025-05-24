import cors from 'cors';
import { envConfig } from '../config/env.config';
import { Express } from 'express';

const corsOptions = {
  origin: [envConfig.REACT_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

export const applyCorsMiddleware = (app: Express): void => {
  app.use(cors(corsOptions));
};

export { corsOptions }; 
