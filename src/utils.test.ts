import { describe, it, expect, vi, beforeEach } from "vitest";
import { getOrSetFakeName } from "./App";

// Fakerのモック
vi.mock("@faker-js/faker", () => ({
  faker: {
    person: {
      firstName: vi.fn(() => "MockedName"),
    },
  },
}));

// sessionStorageのモック
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
});

describe("getOrSetFakeName", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return existing name from sessionStorage", () => {
    // 条件: sessionStorageに既存の名前が保存されている場合
    mockSessionStorage.getItem.mockReturnValue("ExistingUser");

    const result = getOrSetFakeName();

    // 期待される結果: 既存の名前が返される
    expect(result).toBe("ExistingUser");
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith("tutorial_name");
    expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
  });

  it("should generate and store new name when none exists", () => {
    // 条件: sessionStorageに名前が保存されていない場合（null）
    mockSessionStorage.getItem.mockReturnValue(null);

    const result = getOrSetFakeName();

    // 期待される結果: 新しい名前が生成され、sessionStorageに保存される
    expect(result).toBe("MockedName");
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith("tutorial_name");
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith("tutorial_name", "MockedName");
  });

  it("should generate and store new name when sessionStorage returns empty string", () => {
    // 条件: sessionStorageが空文字列を返す場合
    mockSessionStorage.getItem.mockReturnValue("");

    const result = getOrSetFakeName();

    // 期待される結果: 新しい名前が生成され、sessionStorageに保存される
    expect(result).toBe("MockedName");
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith("tutorial_name", "MockedName");
  });

  it("should handle sessionStorage unavailable", () => {
    // 条件: sessionStorage.getItemが例外を投げる場合
    mockSessionStorage.getItem.mockImplementation(() => {
      throw new Error("sessionStorage unavailable");
    });

    // 期待される結果: 例外が適切に処理される（またはエラーが投げられる）
    expect(() => getOrSetFakeName()).toThrow("sessionStorage unavailable");
  });
});