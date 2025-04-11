import got from 'got';
import { Server } from 'http';
import { createApp } from '../src/app';
// idea: unit vs atdd
// check small functions for unit - getDependencies

// designPattern unit test, 
// break even further
// cache function
// getPackage

// happy paths, sad paths, edge cases
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
  //review: sad path
  // 404, 500, any other status that we see often
  // Given, when, then 200. 
  // Gherkin
  // package | version | status | response
  // constants
  // scanorio - JSON w/ a version difference
  // React200v1.4
  // React200v.1.3

  // mock EP functionality - unit

  // manipulate data/test 
  // atdd - have a messy data
   
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
        version: '15.8.0',
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
