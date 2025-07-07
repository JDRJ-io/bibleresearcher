import { describe, it, expect, jest } from '@jest/globals';
import '../main'; // or wherever bootstraps React

describe('UI never calls fetch directly', () => {
  it('should not call fetch directly', () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});