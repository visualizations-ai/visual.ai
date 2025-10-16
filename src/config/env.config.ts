import dotenv from 'dotenv';
import { cleanEnv, str, port, bool } from 'envalid';

dotenv.config();

export const envConfig = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  PORT: port({ default: 3000 }),
  DB_HOST: str(),
  DB_PORT: port({ default: 5432 }),
  POSTGRES_USERNAME: str(),
  POSTGRES_PASSWORD: str(),
  POSTGRES_DATABASE: str(),
  SECRET_KEY_ONE: str(),
  SECRET_KEY_TWO: str(),
  REACT_URL: str(),
  JWT_ACCESS_SECRET: str(),
  CLAUDE_API_KEY: str(),
  DB_SSL: bool({ default: false })
});
