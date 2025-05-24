import { envConfig } from '@/config/env.config';
import { Datasource } from '@/entities/datasource.entity';
import { User } from '@/entities/user.entity';
import { join } from 'path';
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
  entities: [User,Datasource],
  migrations: [join(__dirname, "../database/migrations/**/*{.ts,.js}")],
  ssl: envConfig.DB_SSL ? {
    rejectUnauthorized: false
  } : false
};

export const AppDataSource = new DataSource(databaseConfig);

