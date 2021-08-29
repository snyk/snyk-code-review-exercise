import { getNpmData } from '../src/package';

describe('NPM retrieval functions', () => {
  it('getNpmData() can make retrieval', async () => {
    const data = await getNpmData('@lauf/store-react');
    if (data === null) {
      throw new Error('Should retrieve data');
    }
    expect(data.name).toBe('@lauf/store-react');
    expect((data as any)?.author?.name).toBe('Cefn Hoile');
  });

  it('getNpmData() returns null for non-existent package', async () => {
    const data = await getNpmData('nothingburger');
    expect(data).toBe(null);
  });
});
