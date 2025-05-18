// Required for using decorators (e.g., with TypeORM or class-validator)
import 'reflect-metadata';

// Native Node.js HTTP module for creating the server
import http from 'http';

// Express framework for handling routing and middleware
import express from 'express';

// Cookie-session middleware for session management using cookies
import cookieSession from 'cookie-session';

// Middleware to enable CORS (Cross-Origin Resource Sharing)
import cors from 'cors';

// Main async function to bootstrap the server
const bootstrap = async () => {
  // Create an Express application
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
      //temporary key for development, should be replaced with a secure key in production
      keys: ['asd6465', 'zxc3213554'],
      maxAge: 24 * 7 * 3600000, // 7 days
    }),
  );

  // CORS configuration to allow requests from a specific origin
  const corsOptions = {
    origin: ['http://localhost:4000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  };
  app.use(cors(corsOptions));

  try {
    httpServer.listen(3000, () => {
      console.log('✅ Server is running on port 3000');
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
  }
};

bootstrap().catch(console.error);
