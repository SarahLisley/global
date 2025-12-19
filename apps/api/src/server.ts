import { buildApp } from './app';
import { env } from './utils/env';

const app = buildApp();

const port = Number(env.PORT);
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`API running on http://localhost:${port}`);
});