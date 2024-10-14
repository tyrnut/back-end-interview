import { buildVersionRange } from './constants';

describe('buildVersionRange', () => {
  it('should build basic version range', async () => {
    expect(buildVersionRange(1, 3)).toStrictEqual(['1', '2', '3']);
  });

  it('should throw if inverted', async () => {
    expect(() => buildVersionRange(1, 0)).toThrow();
  });
});
