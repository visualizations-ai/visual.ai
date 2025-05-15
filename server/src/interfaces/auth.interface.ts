
import { Request, Response } from 'express';

declare global {
    namespace Express {
        interface Request {
            currentUser?: TokenPayload;
        }
    }
}  

 export interface TokenPayload {
    id: string;
    email: string;
    activeData:ActiveData
}

export interface ActiveData {
  dbId: string;
  type: string;
}

export interface Context {
  req: Request;
  res: Response;
  user?: {
    userId: string;
    email: string;
  };
}
export interface Auth {
  email: string;
  password: string;
}