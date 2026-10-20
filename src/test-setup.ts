import '@testing-library/jest-dom';

// ─── ResizeObserver polyfill ────────────────────────────────────────────────
// jsdom does not implement ResizeObserver. @xyflow/react uses it internally.
// This minimal stub prevents "ResizeObserver is not defined" errors in tests.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// ─── matchMedia stub ─────────────────────────────────────────────────────────
// jsdom doesn't implement matchMedia. Some components may use it for
// responsive queries.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
