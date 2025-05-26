import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { getServerConfig } from '../config/server-config';


const httpLink = createHttpLink({
  uri: getServerConfig().graphqlUrl,
  credentials: 'include', 
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

export default client;