import { env } from './env';

export const appConfig = () => ({
  port: env.PORT,
  nodeEnv: env.NODE_ENV ?? 'development',
});
