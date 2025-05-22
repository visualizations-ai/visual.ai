import { envConfig } from './config/env.config';
import 'reflect-metadata';
import http from 'http';
import express from 'express';
import cookieSession from 'cookie-session';
import cors from 'cors';
import { Source } from './database/config';
/////////////////////////////
/////////////////////////////
/////////////////////////////
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { schema } from './graphql/schema';
/////////////////////////////
/////////////////////////////
/////////////////////////////

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
  //////////////////////////
  ///////////////////////////
  ///////////////////////////
// API endpoint to get public server configuration
app.get('/api/config', (req, res) => {
  // Only expose safe configuration values
  res.json({
    apiUrl: `http://localhost:${envConfig.PORT}`,
    graphqlEndpoint: '/graphql'
  });
});

  // Create Apollo Server instance
  const apolloServer = new ApolloServer({
    schema,
  });

  // Start Apollo Server
  await apolloServer.start();

  // Apply Apollo middleware to Express with path /graphql
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => ({ req, res }),
    })
  );

  //////////////////////////////
  //////////////////////////////
  //////////////////////////////



  try {
    httpServer.listen(envConfig.PORT, () => {
      console.log(` Server is running on port ${envConfig.PORT}`);
      //////////////////////////////
      console.log(` GraphQL endpoint: http://localhost:${envConfig.PORT}/graphql`);
      //////////////////////////////
    });
  } catch (error) {
    console.error(' Error starting server:', error);
  }
};

Source.initialize().then(() => {
  console.log(' PostgreSQL connected successfully.');
  bootstrap().catch(console.error);
}).catch((error) => console.log(' Error connecting to PostgreSQL.', error));
