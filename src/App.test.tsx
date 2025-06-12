import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App";

// ConvexReactClientのモック
const mockClient = {
  onUpdate: vi.fn(),
  close: vi.fn(),
} as any;

// Convex hooksのモック
vi.mock("convex/react", async () => {
  const actual = await vi.importActual("convex/react");
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
    ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Fakerのモック
vi.mock("@faker-js/faker", () => ({
  faker: {
    person: {
      firstName: vi.fn(() => "TestUser"),
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

// window.scrollToのモック
Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

import { useQuery, useMutation } from "convex/react";

describe("App", () => {
  const mockUseQuery = useQuery as any;
  const mockUseMutation = useMutation as any;
  const mockSendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMutation.mockReturnValue(mockSendMessage);
    mockSessionStorage.getItem.mockReturnValue("TestUser");
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("should render chat header with user name", () => {
    // 条件: メッセージデータが空の場合
    mockUseQuery.mockReturnValue([]);

    render(<App />);

    // 期待される結果: チャットのヘッダーとユーザー名が表示される
    expect(screen.getByText("Convex Chat2")).toBeInTheDocument();
    expect(screen.getByText("TestUser")).toBeInTheDocument();
  });

  it("should render messages correctly", () => {
    // 条件: メッセージのリストが与えられた場合
    const mockMessages = [
      { _id: "1", user: "Alice", body: "こんにちは！" },
      { _id: "2", user: "TestUser", body: "おはよう！" },
      { _id: "3", user: "Bob", body: "元気ですか？" },
    ];
    mockUseQuery.mockReturnValue(mockMessages);

    render(<App />);

    // 期待される結果: 全てのメッセージが正しく表示される
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("こんにちは！")).toBeInTheDocument();
    expect(screen.getAllByText("TestUser")).toHaveLength(2); // ヘッダーとメッセージの両方
    expect(screen.getByText("おはよう！")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("元気ですか？")).toBeInTheDocument();
  });

  it("should apply correct CSS class for own messages", () => {
    // 条件: 自分のメッセージと他人のメッセージが含まれる場合
    const mockMessages = [
      { _id: "1", user: "Alice", body: "他人のメッセージ" },
      { _id: "2", user: "TestUser", body: "自分のメッセージ" },
    ];
    mockUseQuery.mockReturnValue(mockMessages);

    render(<App />);

    const articles = screen.getAllByRole("article");
    
    // 期待される結果: 自分のメッセージには"message-mine"クラスが適用される
    expect(articles[0]).not.toHaveClass("message-mine"); // Aliceのメッセージ
    expect(articles[1]).toHaveClass("message-mine"); // TestUserのメッセージ
  });

  it("should handle form submission correctly", async () => {
    // 条件: フォームに新しいメッセージを入力して送信した場合
    mockUseQuery.mockReturnValue([]);

    render(<App />);

    const input = screen.getByPlaceholderText("Write a message…");
    const submitButton = screen.getByText("Send");

    // メッセージを入力
    fireEvent.change(input, { target: { value: "新しいメッセージ" } });
    
    // 期待される結果: 送信ボタンが有効になる
    expect(submitButton).not.toBeDisabled();

    // フォームを送信
    fireEvent.click(submitButton);

    await waitFor(() => {
      // 期待される結果: sendMessage関数が正しい引数で呼ばれる
      expect(mockSendMessage).toHaveBeenCalledWith({
        user: "TestUser",
        body: "新しいメッセージ"
      });
    });
  });

  it("should disable submit button when input is empty", () => {
    // 条件: 入力フィールドが空の場合
    mockUseQuery.mockReturnValue([]);

    render(<App />);

    const submitButton = screen.getByText("Send");

    // 期待される結果: 送信ボタンが無効化される
    expect(submitButton).toBeDisabled();
  });

  it("should clear input after successful submission", async () => {
    // 条件: フォーム送信が成功した場合
    mockUseQuery.mockReturnValue([]);
    mockSendMessage.mockResolvedValue(undefined);

    render(<App />);

    const input = screen.getByPlaceholderText("Write a message…") as HTMLInputElement;

    // メッセージを入力して送信
    fireEvent.change(input, { target: { value: "テストメッセージ" } });
    fireEvent.submit(input.closest("form")!);

    await waitFor(() => {
      // 期待される結果: 入力フィールドがクリアされる
      expect(input.value).toBe("");
    });
  });

  it("should handle input change correctly", () => {
    // 条件: 入力フィールドでテキストが変更された場合
    mockUseQuery.mockReturnValue([]);

    render(<App />);

    const input = screen.getByPlaceholderText("Write a message…") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "入力中のテキスト" } });

    // 期待される結果: 入力値が正しく更新される
    expect(input.value).toBe("入力中のテキスト");
  });

  it("should scroll to bottom when messages change", () => {
    // 条件: メッセージリストが変更された場合
    vi.useFakeTimers();
    
    const { rerender } = render(<App />);
    mockUseQuery.mockReturnValue([
      { _id: "1", user: "Alice", body: "最初のメッセージ" }
    ]);

    rerender(<App />);

    // タイマーを進める
    vi.runAllTimers();

    // 期待される結果: ページの最下部にスクロールする
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });

    vi.useRealTimers();
  });
});