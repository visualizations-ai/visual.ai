import { DataSource } from "./auth.interface";

export interface DataSourceDocument {
  id?: string;
  userId?: string;
  projectId: string;
  databaseUrl?: string;
  createdAt?: Date;
  type?: string;
  port?: string;
  databaseName?: string;
  username?: string;
  password?: string;
}

export interface DataSourceProjectID {
  id?: string;
  projectId: string;
  type: string;
  database?: string;
}

export interface QueryProp {
  projectId: string;
  sqlQuery: string;
}


export interface AuthPayload {
  collections: string[];
  projectIds: DataSource[];
  user: {
    id: string;
    email: string;
  };
}

export interface SQLQueryData {
  result: Record<string, unknown>[];
  sql: string;
}
