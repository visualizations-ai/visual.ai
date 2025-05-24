import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux' 
import { store } from './store/store';
import { ApolloProvider } from '@apollo/client';
import client from './graphql/apollo-client.ts';
import { fetchServerConfig } from './config/server-config';

import './index.css'
import App from './App.tsx'

const initApp = async () => {
  try {
    await fetchServerConfig();

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <Provider store={store}>
          <ApolloProvider client={client}>
            <App />
          </ApolloProvider>
        </Provider>
      </StrictMode>,
    );
  } catch (error) {
    console.error('Failed to initialize the app:', error);
  }
};

initApp();
