import * as assert from 'assert';
import * as getPort from 'get-port';
import { createApp } from './app';

async function main() {
  // Initialise the server framework and routing
  const app = createApp();

  const p = await getPort({ port: 3000 });
  const server = app.listen(p, 'localhost', () => {
    const addr = server.address();
    assert(addr && typeof addr === 'object');

    const { address, port } = addr;
    console.info(`Server listening on http://${address}:${port}`);
  });
}

main();
