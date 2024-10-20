import log, { LogLevelDesc } from 'loglevel';
import { config } from './config';

log.setLevel(config.logLevel as LogLevelDesc);
export default log;
