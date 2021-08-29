import got from 'got';
import { Server } from 'http';
import { createApp } from '../src/app';

describe('/package/:name/:version endpoint', () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    ({ server, port } = await new Promise<{ server: Server; port: number }>((resolve, reject) => {
      const server = createApp().listen(0, () => {
        const addr = server.address();
        if (addr !== null && typeof addr !== 'string') {
          const { port } = addr;
          return resolve({
            server,
            port,
          });
        }
        reject(new Error('Unexpected address ${addr} for server'));
      });
    }));
  });

  afterAll(async () => {
    server.close();
  });

  it('responds', async () => {
    const packageName = 'react';
    const packageVersion = '16.13.0';

    const res = await got(`http://localhost:${port}/package/${packageName}/${packageVersion}`);
    const json = JSON.parse(res.body);

    expect(res.statusCode).toEqual(200);
    expect(json.name).toEqual(packageName);
    expect(json.version).toEqual(packageVersion);
    expect(json.dependencies).toMatchInlineSnapshot(`
      Object {
        "loose-envify": "^1.1.0",
        "object-assign": "^4.1.1",
        "prop-types": "^15.6.2",
      }
    `);
  });
});
