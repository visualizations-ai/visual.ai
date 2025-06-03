import { Pool, PoolClient } from "pg";
import { DataSourceDocument, QueryProp } from "../interfaces/datasource.interface";
import { GraphQLError } from "graphql";
import { DatasourceService } from "@/services/datasource.service";
import { decrypt } from "@/utils/encryption.util";

export const testPostgreSQLConnection = async (data: DataSourceDocument): Promise<string> => {
  let client: PoolClient | null = null;
  let pool: Pool | null = null;
  const { databaseName, databaseUrl, username, password, port } = data;
  
  try {
    pool = new Pool({
      host: databaseUrl,
      user: username,
      password,
      port: parseInt(`${port}`, 10) ?? 5432,
      database: databaseName,
      max: 20, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000, 
      maxUses: 7500 
    });

    client = await pool.connect();
    await client.query('SELECT 1');
    return 'Successfully connected to PostgreSQL';
  } catch (error: any) {
    throw new GraphQLError(error?.message);
  } finally {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end();
    }
  }
}

export const getPostgreSQLCollections = async (projectId: string, schema: string = 'public'): Promise<string[]> => {
  let client: PoolClient | null = null;
  let pool: Pool | null = null;
  
  try {
    const project = await DatasourceService.getDataSourceByProjectId(projectId);
    const { databaseName, databaseUrl, username, password, port } = project;
    
    pool = new Pool({
      host: decrypt(databaseUrl!),
      user: decrypt(username!),
      password: decrypt(password!),
      port: parseInt(`${port}`, 10) ?? 5432,
      database: decrypt(databaseName!),
      max: 20, 
      idleTimeoutMillis: 30000, 
      connectionTimeoutMillis: 2000,
      maxUses: 7500 
    });
    
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    client = await pool.connect();
    const result = await client.query(query, [schema]);
    const tables = result.rows.map((row) => row.table_name);
    return tables;
  } catch (error: any) {
    console.error('Error getting PostgreSQL collections:', error);
    throw new GraphQLError(error?.message);
  } finally {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end();
    }
  }
}

export const executePostgreSQLQuery = async (data: QueryProp): Promise<Record<string, unknown>[]> => {
  let client: PoolClient | null = null;
  let pool: Pool | null = null;
  
  try {
    const { projectId, sqlQuery } = data;
    const project = await DatasourceService.getDataSourceByProjectId(projectId);
    const { databaseName, databaseUrl, username, password, port } = project;
    
  
    pool = new Pool({
      host: decrypt(databaseUrl!),
      user: decrypt(username!),
      password: decrypt(password!),
      port: parseInt(`${port}`, 10) ?? 5432,
      database: decrypt(databaseName!),
      max: 20, 
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000, 
      maxUses: 7500 
    });
    
    client = await pool.connect();
    const result = await client.query(sqlQuery);
    return result.rows ?? [];
  } catch (error: any) {
    console.error('Error executing PostgreSQL query:', error);
    throw new GraphQLError(error?.message);
  } finally {
    if (client) {
      client.release();
    }
    if (pool) {
      await pool.end();
    }
  }
}