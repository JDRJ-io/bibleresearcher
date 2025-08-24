// Column scroll navigation utility (sticky-aware & alt-friendly)

export type ScrollNavOpts = {
  headerEl: HTMLElement;    // the element with [data-col-key] header cells
  bodyEl: HTMLElement;      // the horizontal scroller for rows
  navigableKeys: string[];  // keys like 'main-translation', 'cross-refs', 'alt-translation-NKJV', ...
};

function getStickyLeftPx(headerEl: HTMLElement) {
  const idx = headerEl.querySelector<HTMLElement>('[data-column="index"]');
  const ref = headerEl.querySelector<HTMLElement>('[data-column="reference"]');
  const w = (el?: HTMLElement | null) => (el ? el.getBoundingClientRect().width : 0);
  return w(idx) + w(ref);
}

function measureLefts(headerEl: HTMLElement, keys: string[], stickyLeft: number) {
  const rectParent = headerEl.getBoundingClientRect();
  return keys.map(k => {
    const cell = headerEl.querySelector<HTMLElement>(`[data-col-key="${k}"]`);
    if (!cell) return { key: k, left: 0, width: 0, ok: false };
    const r = cell.getBoundingClientRect();
    return { key: k, left: Math.max(0, r.left - rectParent.left - stickyLeft), width: r.width, ok: true };
  });
}

export function makeColumnScroller({ headerEl, bodyEl, navigableKeys }: ScrollNavOpts) {
  console.log('🔍 makeColumnScroller called with navigableKeys:', navigableKeys);
  // keep header scroll mirrored to body
  const sync = () => { headerEl.scrollLeft = bodyEl.scrollLeft; };
  bodyEl.addEventListener('scroll', sync, { passive: true });

  const scrollTo = (x: number) => {
    const target = Math.max(0, Math.round(x));
    bodyEl.scrollTo({ left: target, behavior: 'smooth' });
    headerEl.scrollLeft = target; // immediate header update
  };

  const stickyLeft = () => getStickyLeftPx(headerEl);
  const snapshot = () => measureLefts(headerEl, navigableKeys, stickyLeft());

  const currentIndex = () => {
    const S = snapshot();
    const cur = bodyEl.scrollLeft;
    // choose the nearest start >= current
    let idx = 0;
    for (let i = 0; i < S.length; i++) {
      if (S[i].left >= cur - 1) { idx = i; break; }
      idx = i;
    }
    return Math.max(0, Math.min(idx, S.length - 1));
  };

  const step = (dir: -1 | 1) => {
    if (!navigableKeys.length) return;
    const S = snapshot();
    const idx = currentIndex();
    const next = Math.max(0, Math.min(idx + dir, S.length - 1));
    scrollTo(S[next].left);
  };

  const getVisibleRange = () => {
    const S = snapshot();
    const viewLeft = bodyEl.scrollLeft;
    const viewRight = viewLeft + bodyEl.clientWidth - stickyLeft();
    let start = 0, end = 0;
    for (let i = 0; i < S.length; i++) {
      const l = S[i].left, r = l + S[i].width;
      const visible = r > viewLeft && l < viewRight;
      if (visible) { end = i; if (start === 0) start = i; }
    }
    return {
      start: start + 1,
      end: end + 1,
      total: S.length,
      canGoLeft: start > 0,
      canGoRight: end < S.length - 1
    };
  };

  return {
    left: () => step(-1),
    right: () => step(1),
    getVisibleRange,
    destroy: () => bodyEl.removeEventListener('scroll', sync),
  };
}