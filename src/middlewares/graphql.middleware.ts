import { expressMiddleware, ExpressContextFunctionArgument } from '@apollo/server/express4';
import { ApolloServer } from '@apollo/server';
import { Express } from 'express';
import { corsOptions } from './cors.middleware';
import cors from 'cors';

export const applyGraphQLMiddleware = (
  app: Express,
  server: ApolloServer,
): void => {
  app.use(
    '/api/v1/graphql',
    cors(corsOptions),
    expressMiddleware(server, {
      context: async ({ req, res }: ExpressContextFunctionArgument) => ({ req, res })
    })
  );
};
