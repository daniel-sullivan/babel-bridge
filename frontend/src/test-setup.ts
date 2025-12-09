// This setup file is specifically for Vitest tests only
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// extends Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// runs a cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// --------------------------------------------------------------------------------
// Test environment shims and mocks
// --------------------------------------------------------------------------------

// Mock ResizeObserver for tests (minimal but compatible)
class MockResizeObserver {
  // The real ResizeObserver receives a callback and stores it
  constructor(private callback?: ResizeObserverCallback) {}
  observe(_target: Element | SVGElement) {
    // Optionally invoke callback immediately with a fake entry so components relying on initial measurement behave
    try {
      if (this.callback) {
        const entry = {
          contentRect: { width: 100, height: 30 },
          contentBoxSize: [{ inlineSize: 100, blockSize: 30 } as any],
          borderBoxSize: [{ inlineSize: 100, blockSize: 30 } as any],
          devicePixelContentBoxSize: undefined,
          target: _target as Element,
        } as unknown as ResizeObserverEntry;
        // call asynchronously to better match real behavior
        Promise.resolve().then(() => this.callback!([entry], this as unknown as ResizeObserver));
      }
    } catch (e) {
      // swallow - tests shouldn't crash on observation
    }
  }
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  // @ts-ignore assign to global
  globalThis.ResizeObserver = MockResizeObserver;
}

// Minimal IntersectionObserver mock used by some components
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

if (typeof globalThis.IntersectionObserver === 'undefined') {
  // @ts-ignore assign to global
  globalThis.IntersectionObserver = MockIntersectionObserver as any;
}

// Provide stable measurements for HTMLElement to avoid NaN in MUI Ripple calculations
if (typeof window !== 'undefined' && typeof window.HTMLElement !== 'undefined') {
  try {
    // Always provide default numeric offsetWidth/offsetHeight to prevent NaN
    Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() { return 100; }
    });
    Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get() { return 30; }
    });
  } catch (e) {
    // ignore if properties can't be redefined in this environment
  }

  // Ensure getBoundingClientRect always returns numeric values
  const origGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect;
  // @ts-ignore
  window.HTMLElement.prototype.getBoundingClientRect = function () {
    try {
      const r = typeof origGetBoundingClientRect === 'function' ? origGetBoundingClientRect.call(this) : null;
      if (r && typeof r.width === 'number' && !Number.isNaN(r.width)) return r;
    } catch (e) {
      // fallthrough to default
    }
    return { x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 30, width: 100, height: 30, toJSON() { return null; } } as DOMRect;
  };
}

// Stub requestAnimationFrame / cancelAnimationFrame in test environment to make animations deterministic
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  // @ts-ignore
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16) as unknown as number;
}
if (typeof globalThis.cancelAnimationFrame === 'undefined') {
  // @ts-ignore
  globalThis.cancelAnimationFrame = (id?: number) => clearTimeout(id as any);
}

// --------------------------------------------------------------------------------
// Console filtering: only suppress known noisy messages, keep other errors/warnings intact
// --------------------------------------------------------------------------------
const _originalConsoleError = console.error.bind(console);
const _originalConsoleWarn = console.warn.bind(console);

function argsToString(args: unknown[]) {
  try {
    return args.map(a => {
      if (typeof a === 'string') return a;
      if (a && typeof a === 'object' && 'message' in (a as any)) return (a as any).message;
      try { return JSON.stringify(a); } catch { return String(a); }
    }).join(' ');
  } catch (e) {
    return String(args[0]);
  }
}

console.error = (...args: unknown[]) => {
  const s = argsToString(args);
  // Suppress translation library noise that is intentionally tested elsewhere
  if (s.includes('Translation failed')) return;
  _originalConsoleError(...args);
};

console.warn = (...args: unknown[]) => {
  const s = argsToString(args);
  // Suppress specific known warnings about invalid CSS width values produced by some component libraries
  const knownSuppress = [
    'invalid value for the `width` css style property',
    '`NaN` is an invalid value for the `width` css style property',
    // MUI ripple / touch ripple warnings
    'The provided `value` is invalid',
  ];
  if (knownSuppress.some(k => s.includes(k))) return;
  _originalConsoleWarn(...args);
};

// end of file
