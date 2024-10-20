import NodeCache = require('node-cache');
import { config } from './config';

export const cache = new NodeCache({ stdTTL: config.cacheTTL, checkperiod: config.cacheCheckPeriod });
