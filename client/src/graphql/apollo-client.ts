import { ApolloClient, InMemoryCache } from '@apollo/client';
import { getServerConfig } from '../config/server-config';

const client = new ApolloClient({
  uri: getServerConfig().graphqlUrl,
  cache: new InMemoryCache(),
});

export default client;
