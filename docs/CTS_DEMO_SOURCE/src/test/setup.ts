import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: ResizeObserverMock
});

Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: () => "blob:cts-demo"
});

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: () => undefined
});
