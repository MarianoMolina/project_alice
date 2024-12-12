import rateLimit from 'express-rate-limit';
import { RateLimitRequestHandler } from 'express-rate-limit';

export const createRateLimiter = (
  maxRequests: number = 1000,
  windowMinutes: number = 15
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Default rate limiter
export default createRateLimiter();