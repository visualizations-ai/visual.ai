import { Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      currentUser?: TokenPayload;
    }
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
  activeProject: ActiveProject;
}

export interface ActiveProject {
  projectId: string;
  type: string;
}

export interface Auth {
  email: string;
  password: string;
}

export interface AppContext {
  req: Request;
  res: Response;
  user?: {
    userId: string;
    email: string;
  };
}

export interface DataSource {
  id: string;
  projectId: string;
  type: string;
  database: string;
}
