import { jest, expect, it } from '@jest/globals';

jest.spyOn(global, 'fetch').mockImplementation(() => 
  Promise.resolve({
    ok: true, 
    text: () => Promise.resolve(''), 
    json: () => Promise.resolve({})
  }) as any
);

it('synthetic scroll test', () => {
  const { renderHook } = require('@testing-library/react');
  const { useAnchorSlice } = require('../hooks/useAnchorSlice');
  
  const mockRef = { current: null };
  const { result } = renderHook(() => useAnchorSlice(mockRef));
  
  expect(result.current.slice.verseIDs).toContain('gen-1-1-0');
  expect(result.current.slice.verseIDs.length).toBeLessThanOrEqual(201);
});