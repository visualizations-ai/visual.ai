const DEFAULT_SERVER_URL = 'http://localhost:3000';

export interface ServerConfig {
  apiUrl: string;
  graphqlEndpoint: string;
  graphqlUrl: string;
}

let serverConfig: ServerConfig = {
  apiUrl: DEFAULT_SERVER_URL,
  graphqlEndpoint: '/api/v1/graphql', 
  graphqlUrl: `${DEFAULT_SERVER_URL}/api/v1/graphql` 
};

export const fetchServerConfig = async (): Promise<ServerConfig> => {
  try {
    const response = await fetch(`${DEFAULT_SERVER_URL}/api/config`);
    
    if (!response.ok) {
      console.warn('Could not fetch server config, using defaults');
      return serverConfig;
    }
    
    const config = await response.json();
    
    serverConfig = {
      ...config,
      graphqlUrl: `${config.apiUrl}${config.graphqlEndpoint}`
    };
    
    return serverConfig;
  } catch (error) {
    console.warn('Error fetching server config:', error);
    return serverConfig;
  }
};

export const getServerConfig = (): ServerConfig => {
  return serverConfig;
};