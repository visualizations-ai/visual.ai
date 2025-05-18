import { envConfig } from '@/config/env.config';
import { DataSource, DataSourceOptions } from 'typeorm';

const databaseConfig: DataSourceOptions = {
  type: "postgres",
  host: envConfig.DB_HOST,
  port: envConfig.DB_PORT,
  username: envConfig.POSTGRES_USERNAME,
  password: envConfig.POSTGRES_PASSWORD,
  database: envConfig.POSTGRES_DATABASE,
  synchronize: false,
  logging: false,
  connectTimeoutMS: 0,
  entities: ["src/entities/**/*{.ts,.js}"],
  migrations: ["src/database/migrations/**/*{.ts,.js}"],
};

export const AppDataSource = new DataSource(databaseConfig);
