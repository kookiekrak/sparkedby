import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';

type AuthenticatedHandler = (req: AuthenticatedRequest, res: Response) => Promise<any>;

export const wrapAuthenticatedHandler = (handler: AuthenticatedHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req as AuthenticatedRequest, res);
    } catch (error) {
      next(error);
    }
  };
}; 