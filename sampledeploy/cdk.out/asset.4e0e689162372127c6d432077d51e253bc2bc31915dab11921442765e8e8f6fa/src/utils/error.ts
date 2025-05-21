import { Response } from 'express';

export function handleError(res: Response, error: any) {
  console.error('Error:', error);
  return res.status(500).json({
    error: error.message || 'An unexpected error occurred'
  });
} 