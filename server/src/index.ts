import { envConfig } from './config/env.config';
import 'reflect-metadata';
import http from 'http';
import express from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';

const bootstrap = async () => {
  const app = express();

  // Create a raw HTTP server using the Express app instance
  const httpServer: http.Server = new http.Server(app);

  // Trust the first proxy in front of the app (needed for cookie-session)
  app.set('trust proxy', 1);

  // Set up cookie-session middleware
  // - name: name of the session cookie
  // - keys: used to encrypt the cookie
  // - maxAge: cookie expiration time (7 days in milliseconds)
  app.use(
    cookieSession({
      name: 'session',
      //implementing cookie encryption for production
      keys: [envConfig.SECRET_KEY_ONE, envConfig.SECRET_KEY_TWO],
      maxAge: 24 * 7 * 3600000, // 7 days
    }),
  );

  // CORS configuration to allow requests from a specific origin
  const corsOptions = {
    origin: [envConfig.REACT_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  };
  app.use(cors(corsOptions));

  try {
    httpServer.listen(envConfig.PORT, () => {
      console.log(`✅ Server is running on port${envConfig.PORT}`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
  }
};

bootstrap().catch(console.error);
