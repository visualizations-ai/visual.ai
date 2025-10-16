import cors from 'cors';
import { envConfig } from '../config/env.config';
import { Express } from 'express';

const corsOptions = {
  origin: [
    envConfig.REACT_URL,
    'https://embeddable-sandbox.cdn.apollographql.com',
    'http://localhost:4000',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

export const applyCorsMiddleware = (app: Express): void => {
  app.use(cors(corsOptions));
};

export { corsOptions }; 
