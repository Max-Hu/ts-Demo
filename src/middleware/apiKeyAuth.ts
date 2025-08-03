import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    apiKey: string;
  };
}

export const apiKeyAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const apiKeyHeader = process.env.API_KEY_HEADER || 'x-api-key';
  const apiKey = req.headers[apiKeyHeader] as string;
  const expectedApiKey = process.env.API_KEY;

  if (!apiKey) {
    logger.warn('API key missing from request', { 
      ip: req.ip, 
      path: req.path,
      headers: req.headers 
    });
    return res.status(401).json({ 
      error: 'API key required',
      message: `Please provide API key in '${apiKeyHeader}' header` 
    });
  }

  if (!expectedApiKey) {
    logger.error('API_KEY environment variable not set');
    return res.status(500).json({ 
      error: 'Server configuration error' 
    });
  }

  if (apiKey !== expectedApiKey) {
    logger.warn('Invalid API key provided', { 
      ip: req.ip, 
      path: req.path 
    });
    return res.status(403).json({ 
      error: 'Invalid API key' 
    });
  }

  // Add user info to request for potential future use
  req.user = { apiKey };
  
  logger.debug('API key authentication successful', { 
    ip: req.ip, 
    path: req.path 
  });

  next();
}; 