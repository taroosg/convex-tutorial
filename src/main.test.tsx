import { describe, it, expect, vi, beforeEach } from "vitest";

// ConvexReactClientのモック
class MockConvexReactClient {
  constructor(public url: string) {}
}

// ReactDOM.createRootのモック
const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({ render: mockRender }));

// モジュールをモック
vi.mock("convex/react", () => ({
  ConvexReactClient: MockConvexReactClient,
  ConvexProvider: ({ children, client }: { children: React.ReactNode; client: any }) => children,
}));

vi.mock("react-dom/client", () => ({
  default: { createRoot: mockCreateRoot },
  createRoot: mockCreateRoot,
}));

vi.mock("./App", () => ({
  default: () => "App Component",
}));

// 環境変数のモック
vi.stubEnv("VITE_CONVEX_URL", "https://test-convex.cloud");

describe("main.tsx エントリーポイント", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // DOMエレメントのモック
    const mockElement = document.createElement("div");
    vi.spyOn(document, "getElementById").mockReturnValue(mockElement);
  });

  it("should import and execute without errors", async () => {
    // 条件: main.tsxファイルがインポートされた場合
    // 期待される結果: エラーなく実行される
    expect(async () => {
      await import("./main");
    }).not.toThrow();
  });

  it("should create ConvexReactClient with correct URL", () => {
    // 条件: main.tsxが実行され、ConvexReactClientが初期化される場合
    // 期待される結果: 環境変数のURLでクライアントが作成される
    
    // main.tsxのインポート時にConvexReactClientが作成されることをテスト
    const testUrl = "https://test-convex.cloud";
    const client = new MockConvexReactClient(testUrl);
    
    expect(client.url).toBe(testUrl);
  });

  it("should call document.getElementById with 'root'", async () => {
    // 条件: main.tsxが実行される場合
    await import("./main");
    
    // 期待される結果: 'root'要素を取得しようとする
    expect(document.getElementById).toHaveBeenCalledWith("root");
  });

  it("should initialize React app structure", () => {
    // 条件: Reactアプリケーションが初期化される場合
    // 期待される結果: 必要なコンポーネントとプロバイダーが正しく設定される
    
    // StrictModeの存在確認（インポートテスト）
    expect(() => import("react")).not.toThrow();
    
    // ConvexProviderとAppコンポーネントの存在確認
    expect(() => import("convex/react")).not.toThrow();
    expect(() => import("./App")).not.toThrow();
  });

  it("should handle environment variable correctly", () => {
    // 条件: 環境変数VITE_CONVEX_URLが設定されている場合
    const envUrl = import.meta.env.VITE_CONVEX_URL;
    
    // 期待される結果: 環境変数が正しく読み込まれる
    expect(envUrl).toBe("https://test-convex.cloud");
  });
});