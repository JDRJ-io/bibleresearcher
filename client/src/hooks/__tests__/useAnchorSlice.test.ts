
import { renderHook } from '@testing-library/react';
import { useAnchorSlice } from '../useAnchorSlice';
import { useRef } from 'react';

// Mock the dependencies
jest.mock('../useAnchorScroll', () => ({
  useAnchorScroll: jest.fn(() => ({ anchorIndex: 1500 }))
}));

jest.mock('../useChunk', () => ({
  useChunk: jest.fn(() => ({ start: 1400, end: 1600, verseIDs: ['gen-1-1'] }))
}));

jest.mock('../useRowData', () => ({
  useRowData: jest.fn(() => new Map([['gen-1-1', { id: 'gen-1-1' }]]))
}));

jest.mock('@/lib/verseKeysLoader', () => ({
  getVerseKeys: jest.fn(() => ['Gen.1:1', 'Gen.1:2'])
}));

describe('useAnchorSlice', () => {
  it('keeps anchor inside the slice', () => {
    const { result } = renderHook(() => {
      const ref = useRef(null);
      return useAnchorSlice(ref);
    });

    // Mock 1500 px scrollTop
    const anchorIndex = result.current.anchorIndex;
    const slice = result.current.slice;
    
    expect(slice.verseIDs).toContain('gen-1-1');
    expect(slice.start).toBeLessThanOrEqual(anchorIndex);
    expect(slice.end).toBeGreaterThan(anchorIndex);
  });
});
