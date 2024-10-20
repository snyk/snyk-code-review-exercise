import got from 'got';
import { cache } from '../../src/cache';
import { resolvePackageTree } from '../../src/package';

// Mocking got library
jest.mock('got');
const mockedGot = got as jest.MockedFunction<typeof got>;

describe('resolvePackageTree (Unit Test with Mocked got)', () => {
  beforeEach(() => {
    cache.flushAll(); // Clear cache before each test
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  it('resolves a package and its dependencies successfully with mocked got', async () => {
    // Type for the mocked response value
    const mockJsonReturnValue = {
      versions: {
        '16.13.0': {
          dependencies: {
            'loose-envify': '^1.4.0',
          },
        },
        '1.4.0': { dependencies: {} }, // Add mock versions for dependencies
      },
    };

    // Mock the `got` function to return the JSON directly since we're using `responseType: 'json'`
    mockedGot.mockResolvedValue({
      body: mockJsonReturnValue, // Simulate the parsed JSON result
    } as unknown);
    // Call the function we're testing
    const tree = await resolvePackageTree('react', '16.13.0');

    // Check the output
    expect(tree).toEqual({
      version: '16.13.0',
      dependencies: {
        'loose-envify': {
          version: '1.4.0',
          dependencies: {},
        },
      },
    });

    // Ensure that got was called with the correct URL and options
    expect(mockedGot).toHaveBeenCalledWith('https://registry.npmjs.org/react', { responseType: 'json' });
  });

  it('returns a partial tree when depth is exceeded', async () => {
    const mockJsonReturnValue = {
      versions: {
        '16.13.0': {
          dependencies: {
            'loose-envify': '^1.4.0',
          },
        },
      },
    };

    mockedGot.mockResolvedValue({
      body: mockJsonReturnValue, // Simulate the parsed JSON result
    } as unknown);

    // Simulate depth exceeding the MAX_DEPTH constant
    const MAX_DEPTH = 5; // Assume this is the constant in the code
    const tree = await resolvePackageTree('react', '16.13.0', MAX_DEPTH + 1);

    // Check for the partial flag in the returned package tree
    expect(tree).toEqual({
      version: 'unknown',
      dependencies: {},
      partial: true,
    });
  });

  it('pulls from cache if the package is already cached', async () => {
    // Manually set the cache
    cache.set('react@16.13.0', {
      version: '16.13.0',
      dependencies: {
        'loose-envify': {
          version: '1.4.0',
          dependencies: {},
        },
      },
    });

    // Call the function to see if it pulls from cache
    const tree = await resolvePackageTree('react', '16.13.0');

    // Ensure no network request was made since we pull from cache
    expect(mockedGot).not.toHaveBeenCalled();

    // Check the output matches what's in the cache
    expect(tree).toEqual({
      version: '16.13.0',
      dependencies: {
        'loose-envify': {
          version: '1.4.0',
          dependencies: {},
        },
      },
    });
  });

  it('throws error for circular dependencies', async () => {
    const mockJsonReturnValue = {
      versions: {
        '16.13.0': {
          dependencies: {
            'prop-types': '^15.8.1',
          },
        },
        '15.8.1': {
          dependencies: {
            'react': '^16.13.0',  // Circular dependency here
          },
        },
      },
    };

    mockedGot.mockResolvedValue({
      body: mockJsonReturnValue, // Simulate the parsed JSON result
    } as unknown);

    await expect(resolvePackageTree('react', '16.13.0')).rejects.toThrow(
      'Circular dependency detected for package: react');
    expect(mockedGot).toHaveBeenCalledWith('https://registry.npmjs.org/react', { responseType: 'json' });
  });
});
