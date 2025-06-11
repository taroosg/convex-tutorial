import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.scrollTo globally
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

// Mock sessionStorage globally
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
});

// Make mock available globally for tests
global.mockSessionStorage = mockSessionStorage;
