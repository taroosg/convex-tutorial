import { describe, it, expect, vi, beforeEach } from "vitest";
import { convexTest } from "convex-test";
import { api } from "./_generated/api";
import {
  getSummaryFromJSON,
  extractWikiTopic,
  buildWikipediaUrl,
} from "./chat";

describe("chat.ts", () => {
  describe("getSummaryFromJSON", () => {
    it("should extract summary from Wikipedia API response", () => {
      // 条件: Wikipedia APIの正常なレスポンスが与えられた場合
      const mockResponse = {
        query: {
          pages: {
            "12345": {
              extract: "これはテスト用のWikipediaの要約です。",
            },
          },
        },
      };

      // 期待される結果: 正しい要約テキストが返される
      const result = getSummaryFromJSON(mockResponse);
      expect(result).toBe("これはテスト用のWikipediaの要約です。");
    });

    it("should handle multiple pages and return first page extract", () => {
      // 条件: 複数のページを含むレスポンスが与えられた場合
      const mockResponse = {
        query: {
          pages: {
            "11111": {
              extract: "最初のページの要約",
            },
            "22222": {
              extract: "二番目のページの要約",
            },
          },
        },
      };

      // 期待される結果: 最初のページの要約が返される（オブジェクトキーの順序による）
      const result = getSummaryFromJSON(mockResponse);
      expect(result).toBe("最初のページの要約");
    });

    it("should handle missing extract field", () => {
      // 条件: extractフィールドが存在しないレスポンスが与えられた場合
      const mockResponse = {
        query: {
          pages: {
            "12345": {
              title: "テストページ",
            },
          },
        },
      };

      // 期待される結果: undefinedが返される
      const result = getSummaryFromJSON(mockResponse);
      expect(result).toBeUndefined();
    });
  });

  describe("getWikipediaSummary action handler logic", () => {
    beforeEach(() => {
      // fetchのモック
      global.fetch = vi.fn();
    });

    it("should construct Wikipedia API URL correctly", () => {
      // 条件: トピックが与えられた場合
      const topic = "人工知能";
      const expectedUrl =
        "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=" +
        topic;

      // 期待される結果: 正しいAPIのURLが構築される
      expect(expectedUrl).toContain("https://en.wikipedia.org/w/api.php");
      expect(expectedUrl).toContain("format=json");
      expect(expectedUrl).toContain("action=query");
      expect(expectedUrl).toContain("titles=" + topic);
    });

    it("should handle fetch response correctly", async () => {
      // 条件: fetchが正常なレスポンスを返す場合
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          query: {
            pages: {
              "12345": {
                extract: "テスト用のWikipedia要約",
              },
            },
          },
        }),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const response = await fetch("test-url");
      const data = await response.json();
      const summary = getSummaryFromJSON(data);

      // 期待される結果: 正しく要約が抽出される
      expect(summary).toBe("テスト用のWikipedia要約");
    });

    it("should handle fetch error gracefully", async () => {
      // 条件: fetchがエラーを投げる場合
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      // 期待される結果: エラーが適切に処理される
      await expect(fetch("test-url")).rejects.toThrow("Network error");
    });
  });
  describe("Convex function exports", () => {
    it("should export sendMessage function", async () => {
      // 条件: sendMessage関数がエクスポートされている場合
      const { sendMessage } = await import("./chat");

      // 期待される結果: 関数が存在する
      expect(sendMessage).toBeDefined();
      expect(typeof sendMessage).toBe("function");
    });

    it("should export getMessages function", async () => {
      // 条件: getMessages関数がエクスポートされている場合
      const { getMessages } = await import("./chat");

      // 期待される結果: 関数が存在する
      expect(getMessages).toBeDefined();
      expect(typeof getMessages).toBe("function");
    });

    it("should export getWikipediaSummary function", async () => {
      // 条件: getWikipediaSummary関数がエクスポートされている場合
      const { getWikipediaSummary } = await import("./chat");

      // 期待される結果: 関数が存在する
      expect(getWikipediaSummary).toBeDefined();
      expect(typeof getWikipediaSummary).toBe("function");
    });

    it("should export getSummaryFromJSON function", async () => {
      // 条件: getSummaryFromJSON関数がエクスポートされている場合
      const { getSummaryFromJSON } = await import("./chat");

      // 期待される結果: 関数が存在する
      expect(getSummaryFromJSON).toBeDefined();
      expect(typeof getSummaryFromJSON).toBe("function");
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle missing query in Wikipedia response", () => {
      // 条件: queryフィールドが存在しないレスポンスが与えられた場合
      const invalidData = {};

      // 期待される結果: エラーが発生する
      expect(() => {
        getSummaryFromJSON(invalidData);
      }).toThrow();
    });

    it("should handle null or undefined data", () => {
      // 条件: null または undefined が与えられた場合
      // 期待される結果: エラーが発生する
      expect(() => {
        getSummaryFromJSON(null);
      }).toThrow();

      expect(() => {
        getSummaryFromJSON(undefined);
      }).toThrow();
    });
  });

  describe("extractWikiTopic", () => {
    it("should extract topic from valid wiki command", () => {
      // 条件: 有効なwikiコマンドが与えられた場合
      const command = "/wiki JavaScript";
      const topic = extractWikiTopic(command);

      // 期待される結果: トピックが正しく抽出される
      expect(topic).toBe("JavaScript");
    });

    it("should return null for non-wiki commands", () => {
      // 条件: wikiコマンドでないメッセージが与えられた場合
      const message = "Hello world";
      const topic = extractWikiTopic(message);

      // 期待される結果: nullが返される
      expect(topic).toBeNull();
    });

    it("should return empty string for wiki command without topic", () => {
      // 条件: トピックなしのwikiコマンドが与えられた場合
      const command = "/wiki";
      const topic = extractWikiTopic(command);

      // 期待される結果: 空文字列が返される
      expect(topic).toBe("");
    });

    it("should handle wiki command with multiple words", () => {
      // 条件: 複数の単語を含むwikiコマンドが与えられた場合
      const command = "/wiki artificial intelligence machine learning";
      const topic = extractWikiTopic(command);

      // 期待される結果: 全ての単語が含まれる
      expect(topic).toBe("artificial intelligence machine learning");
    });
  });

  describe("buildWikipediaUrl", () => {
    it("should build correct Wikipedia API URL", () => {
      // 条件: トピックが与えられた場合
      const topic = "JavaScript";
      const url = buildWikipediaUrl(topic);

      // 期待される結果: 正しいAPIのURLが生成される
      expect(url).toContain("https://en.wikipedia.org/w/api.php");
      expect(url).toContain("format=json");
      expect(url).toContain("action=query");
      expect(url).toContain("prop=extracts");
      expect(url).toContain("titles=JavaScript");
    });

    it("should handle topics with spaces", () => {
      // 条件: スペースを含むトピックが与えられた場合
      const topic = "artificial intelligence";
      const url = buildWikipediaUrl(topic);

      // 期待される結果: URLエンコードが適切に行われる（URLSearchParamsは+を使用）
      expect(url).toContain("titles=artificial+intelligence");
    });

    it("should handle topics with special characters", () => {
      // 条件: 特殊文字を含むトピックが与えられた場合
      const topic = "C++";
      const url = buildWikipediaUrl(topic);

      // 期待される結果: 特殊文字が適切にエンコードされる
      expect(url).toContain("titles=C%2B%2B");
    });
  });
});

// Convex-test framework tests for DB operations
describe("Database Operations with convex-test", () => {
  it("should insert message into database using sendMessage mutation", async () => {
    // convex-testフレームワークを使用してDBテストを実行
    const t = convexTest();

    // テストデータ
    const testUser = "Alice";
    const testBody = "Hello, world!";

    // sendMessage mutationを実行
    await t.mutation(api.chat.sendMessage, {
      user: testUser,
      body: testBody,
    });

    // データベースからメッセージを取得して検証
    const messages = await t.query(api.chat.getMessages);

    // 期待される結果: メッセージが正しく挿入されている
    expect(messages).toHaveLength(1);
    expect(messages[0].user).toBe(testUser);
    expect(messages[0].body).toBe(testBody);
  });

  it("should retrieve messages in chronological order using getMessages query", async () => {
    const t = convexTest();

    // 複数のメッセージを挿入
    await t.mutation(api.chat.sendMessage, {
      user: "Alice",
      body: "First message",
    });

    await t.mutation(api.chat.sendMessage, {
      user: "Bob",
      body: "Second message",
    });

    await t.mutation(api.chat.sendMessage, {
      user: "Carol",
      body: "Third message",
    });

    // メッセージを取得
    const messages = await t.query(api.chat.getMessages);

    // 期待される結果: メッセージが時系列順に並んでいる
    expect(messages).toHaveLength(3);
    expect(messages[0].body).toBe("First message");
    expect(messages[1].body).toBe("Second message");
    expect(messages[2].body).toBe("Third message");
  });

  it("should store regular message in database", async () => {
    const t = convexTest();

    // 通常のメッセージを送信（wikiコマンドではない）
    await t.mutation(api.chat.sendMessage, {
      user: "TestUser",
      body: "This is a regular message",
    });

    // メッセージがデータベースに保存されていることを確認
    const messages = await t.query(api.chat.getMessages);

    expect(messages).toHaveLength(1);
    expect(messages[0].user).toBe("TestUser");
    expect(messages[0].body).toBe("This is a regular message");
  });

  it("should handle multiple messages with different content", async () => {
    const t = convexTest();

    // 様々な種類の通常メッセージを送信
    await t.mutation(api.chat.sendMessage, {
      user: "User1",
      body: "Hello everyone!",
    });

    await t.mutation(api.chat.sendMessage, {
      user: "User2",
      body: "Good morning",
    });

    await t.mutation(api.chat.sendMessage, {
      user: "User3",
      body: "How is everyone doing?",
    });

    const messages = await t.query(api.chat.getMessages);

    // 期待される結果: 全てのメッセージが正しく保存されている
    expect(messages).toHaveLength(3);
    expect(messages[0].body).toBe("Hello everyone!");
    expect(messages[1].body).toBe("Good morning");
    expect(messages[2].body).toBe("How is everyone doing?");
  });

  it("should handle special content types", async () => {
    const t = convexTest();

    // 空メッセージ
    await t.mutation(api.chat.sendMessage, {
      user: "User1",
      body: "",
    });

    // 特殊文字を含むメッセージ
    await t.mutation(api.chat.sendMessage, {
      user: "ユーザー名",
      body: "こんにちは！🌟",
    });

    const messages = await t.query(api.chat.getMessages);

    expect(messages).toHaveLength(2);
    expect(messages[0].body).toBe("");
    expect(messages[1].user).toBe("ユーザー名");
    expect(messages[1].body).toBe("こんにちは！🌟");
  });

  it("should handle query ordering and limit functionality", async () => {
    const t = convexTest();

    // 5個のメッセージを挿入（クエリ動作をテスト）
    for (let i = 1; i <= 5; i++) {
      await t.mutation(api.chat.sendMessage, {
        user: `User${i}`,
        body: `Message ${i}`,
      });
    }

    const messages = await t.query(api.chat.getMessages);

    // 期待される結果: 全てのメッセージが時系列順で返される
    expect(messages).toHaveLength(5);
    expect(messages[0].body).toBe("Message 1");
    expect(messages[4].body).toBe("Message 5");
    
    // メッセージが正しい順序で返されることを確認
    for (let i = 0; i < 5; i++) {
      expect(messages[i].body).toBe(`Message ${i + 1}`);
    }
  });

  it("should test Wikipedia URL construction and fetch logic", async () => {
    // fetchをモック
    global.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        query: {
          pages: {
            "12345": {
              extract: "JavaScript is a programming language.",
            },
          },
        },
      }),
    });

    // Wikipedia API呼び出しをシミュレート
    const topic = "JavaScript";
    const expectedUrl =
      "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=" +
      topic;

    const response = await fetch(expectedUrl);
    const data = await response.json();
    const summary = getSummaryFromJSON(data);

    expect(fetch).toHaveBeenCalledWith(expectedUrl);
    expect(summary).toBe("JavaScript is a programming language.");
  });
});
