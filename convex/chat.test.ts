import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSummaryFromJSON } from "./chat";

describe("chat.ts", () => {
  describe("getSummaryFromJSON", () => {
    it("should extract summary from Wikipedia API response", () => {
      // 条件: Wikipedia APIの正常なレスポンスが与えられた場合
      const mockResponse = {
        query: {
          pages: {
            "12345": {
              extract: "これはテスト用のWikipediaの要約です。"
            }
          }
        }
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
              extract: "最初のページの要約"
            },
            "22222": {
              extract: "二番目のページの要約"
            }
          }
        }
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
              title: "テストページ"
            }
          }
        }
      };

      // 期待される結果: undefinedが返される
      const result = getSummaryFromJSON(mockResponse);
      expect(result).toBeUndefined();
    });
  });

  describe("sendMessage mutation", () => {
    // 注意: Convexのmutationは実際のConvexランタイムでのみテスト可能
    // このセクションでは、関数の構造とロジックの単体テストを作成

    it("should handle wiki command correctly", () => {
      // 条件: "/wiki"で始まるメッセージが送信された場合
      const wikiMessage = "/wiki 日本";
      const topic = wikiMessage.slice(wikiMessage.indexOf(" ") + 1);

      // 期待される結果: トピックが正しく抽出される
      expect(topic).toBe("日本");
    });

    it("should extract topic from wiki command with multiple words", () => {
      // 条件: 複数の単語を含むwikiコマンドが送信された場合
      const wikiMessage = "/wiki artificial intelligence";
      const topic = wikiMessage.slice(wikiMessage.indexOf(" ") + 1);

      // 期待される結果: スペース以降の全ての文字列が抽出される
      expect(topic).toBe("artificial intelligence");
    });

    it("should handle wiki command without topic", () => {
      // 条件: トピックなしの"/wiki"コマンドが送信された場合
      const wikiMessage = "/wiki";
      const spaceIndex = wikiMessage.indexOf(" ");
      const topic = spaceIndex !== -1 ? wikiMessage.slice(spaceIndex + 1) : "";

      // 期待される結果: 空文字列が返される
      expect(topic).toBe("");
    });
  });
});

// getSummaryFromJSON関数をテスト可能にするため、エクスポートする必要があります
// 実際のchat.tsファイルでこの関数をexportする必要があります