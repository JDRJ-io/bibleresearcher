import { describe, it, expect, jest } from '@jest/globals';

describe('UI never calls fetch directly', () => {
  it('should not call fetch directly', () => {
    const spy = jest.spyOn(global, 'fetch');
    require('../main'); // bootstrap React
    expect(spy).not.toHaveBeenCalled();
  });
});