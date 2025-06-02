export interface DatabaseConnectionInput {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface CreateDatasourceInput extends DatabaseConnectionInput {
  projectId: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

export interface Datasource {
  id: string;
  projectId: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
}