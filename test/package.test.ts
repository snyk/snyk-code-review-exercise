import got from 'got';
import { Server } from 'http';
import { createApp } from '../src/app';

describe('/package/:name/:version endpoint', () => {
  let server: Server;
  let port: number;

  beforeAll(async () => {
    server = await new Promise((resolve, reject) => {
      const server = createApp().listen(0, () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          port = addr.port;
          resolve(server);
        } else {
          reject(new Error('Unexpected address ${addr} for server'));
        }
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('responds', async () => {
    const packageName = 'react';
    const packageVersion = '16.13.0';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await got(
      `http://localhost:${port}/package/${packageName}/${packageVersion}`,
    );
    const json = JSON.parse(res.body);

    expect(res.statusCode).toEqual(200);
    expect(json.name).toEqual(packageName);
    expect(json.version).toEqual(packageVersion);
    expect(json.dependencies).toEqual({
      'loose-envify': {
        version: '1.4.0',
        dependencies: {
          'js-tokens': {
            version: '4.0.0',
            dependencies: {},
          },
        },
      },
      'object-assign': {
        version: '4.1.1',
        dependencies: {},
      },
      'prop-types': {
        version: '15.7.2',
        dependencies: {
          'object-assign': {
            version: '4.1.1',
            dependencies: {},
          },
          'loose-envify': {
            version: '1.4.0',
            dependencies: {
              'js-tokens': {
                version: '4.0.0',
                dependencies: {},
              },
            },
          },
          'react-is': {
            version: '16.13.1',
            dependencies: {},
          },
        },
      },
    });
  });
});
