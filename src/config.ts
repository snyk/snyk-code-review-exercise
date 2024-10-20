import 'dotenv/config';

export const config = {
  cacheTTL: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : 600, // Default to 10 minutes
  cacheCheckPeriod: process.env.CACHE_CHECK_PERIOD ? parseInt(
    process.env.CACHE_CHECK_PERIOD) : 120, // Default to 2 minutes
  maxDepth: process.env.MAX_DEPTH ? parseInt(process.env.MAX_DEPTH) : 5, // Default to 5
  logLevel: process.env.LOG_LEVEL || 'info',
};
