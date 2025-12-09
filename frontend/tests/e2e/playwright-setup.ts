// Playwright-specific setup file that doesn't load Vitest internals
// This avoids conflicts with Playwright's own expect implementation

// Mock ResizeObserver for Playwright browser tests
if (typeof globalThis.ResizeObserver === 'undefined') {
  class MockResizeObserver {
    constructor(private callback?: ResizeObserverCallback) {}
    observe(_target: Element | SVGElement) {
      try {
        if (this.callback) {
          const entry = {
            contentRect: { width: 100, height: 30 },
            contentBoxSize: [{ inlineSize: 100, blockSize: 30 } as any],
            borderBoxSize: [{ inlineSize: 100, blockSize: 30 } as any],
            devicePixelContentBoxSize: undefined,
            target: _target as Element,
          } as unknown as ResizeObserverEntry;
          Promise.resolve().then(() => this.callback!([entry], this as unknown as ResizeObserver));
        }
      } catch (e) {}
    }
    unobserve() {}
    disconnect() {}
  }

  // @ts-ignore
  globalThis.ResizeObserver = MockResizeObserver;
}

// Mock IntersectionObserver
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    constructor(private callback?: IntersectionObserverCallback) {}
    observe(target: Element) {
      try {
        if (this.callback) {
          const entry: IntersectionObserverEntry = {
            isIntersecting: true,
            intersectionRatio: 1,
            time: Date.now(),
            target,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: null as any,
          } as unknown as IntersectionObserverEntry;
          Promise.resolve().then(() => this.callback!([entry], this as unknown as IntersectionObserver));
        }
      } catch (e) {}
    }
    unobserve() {}
    disconnect() {}
  }

  // @ts-ignore
  globalThis.IntersectionObserver = MockIntersectionObserver;
}
