import 'reflect-metadata';
import http from 'http';
import express, { Request, Response } from 'express';
import { ApolloServer, BaseContext } from '@apollo/server';
import { GraphQLFormattedError, GraphQLSchema } from 'graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';

import { envConfig } from './config/env.config';
import { AppDataSource } from './database/config';
import { mergedGQLSchema } from './graphql/schemas';
import { mergedGQLResolvers } from './graphql/resolvers';
import { AppContext } from './interfaces/auth.interface';

import { applySessionMiddleware } from './middlewares/session.middleware';
import { applyCorsMiddleware } from './middlewares/cors.middleware';
import { applyBodyParserMiddleware } from './middlewares/body.middleware';
import { applyGraphQLMiddleware } from './middlewares/graphql.middleware';

const bootstrap = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const schema: GraphQLSchema = makeExecutableSchema({
    typeDefs: mergedGQLSchema,
    resolvers: mergedGQLResolvers,
  });

  const server = new ApolloServer<BaseContext | AppContext>({
    schema,
    formatError: (error: GraphQLFormattedError) => ({
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
    }),
    introspection: envConfig.NODE_ENV === 'development',
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      envConfig.NODE_ENV !== 'production'
        ? ApolloServerPluginLandingPageLocalDefault({ embed: true, includeCookies: true })
        : ApolloServerPluginLandingPageDisabled(),
    ],
  });

  await server.start();

  applySessionMiddleware(app);
  applyCorsMiddleware(app);
  applyBodyParserMiddleware(app);
  applyGraphQLMiddleware(app, server);

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).send('Visual.ai service is healthy and OK.');
  });

  try {
    httpServer.listen(envConfig.PORT, () => {
      console.log(`Server is running on port ${envConfig.PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

AppDataSource.initialize()
  .then(() => {
    console.log('PostgreSQL connected successfully.');
    bootstrap().catch(console.error);
  })
  .catch((error) => {
    console.error('Error connecting to PostgreSQL.', error);
  });
