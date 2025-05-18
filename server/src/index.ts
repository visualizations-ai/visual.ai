import 'reflect-metadata';

import http from 'http';

import express from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';


const bootstrap = async () => {
  const app = express();
  const httpServer: http.Server = new http.Server(app);


  app.set('trust proxy', 1);
  app.use(
    cookieSession({
      name: 'session',
      // This is the secret used to encrypt the cookie temporarily
      keys: ['asd6465', 'zxc3213554'],
      maxAge: 24 * 7 * 3600000,
      }),
    );
    const corsOptions = {
      origin: ['http://localhost:4000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE' , 'OPTIONS'],

    }
    app.use(cors(corsOptions));

    try {
      httpServer.listen(3000, () => {
        console.log('Server is running on port 3000');
      })
    }catch (error) {
      console.error('Error starting server:', error);
    }
}

bootstrap().catch(console.error);
