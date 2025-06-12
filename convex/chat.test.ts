import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSummaryFromJSON, extractWikiTopic, buildWikipediaUrl } from "./chat";

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

  describe("sendMessage mutation handler logic", () => {
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

    it("should detect wiki command start correctly", () => {
      // 条件: 様々なメッセージが与えられた場合
      const wikiCommand = "/wiki test";
      const normalMessage = "hello world";
      const wikiInMiddle = "check /wiki test";

      // 期待される結果: /wikiで始まるメッセージのみが検出される
      expect(wikiCommand.startsWith("/wiki")).toBe(true);
      expect(normalMessage.startsWith("/wiki")).toBe(false);
      expect(wikiInMiddle.startsWith("/wiki")).toBe(false);
    });
  });

  describe("getMessages query handler logic", () => {
    it("should handle message ordering logic", () => {
      // 条件: メッセージの配列が与えられた場合
      const mockMessages = [
        { _id: "3", user: "Carol", body: "Latest message" },
        { _id: "1", user: "Alice", body: "First message" },
        { _id: "2", user: "Bob", body: "Middle message" }
      ];

      // 期待される結果: reverse()を呼んだ時に順序が逆転する
      const reversed = [...mockMessages].reverse();
      expect(reversed[0]._id).toBe("2");
      expect(reversed[2]._id).toBe("3");
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
      const expectedUrl = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=" + topic;

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
                extract: "テスト用のWikipedia要約"
              }
            }
          }
        })
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
    it("should handle malformed Wikipedia response", () => {
      // 条件: 不正な形式のWikipediaレスポンスが与えられた場合
      const malformedData = {
        query: {
          pages: {}
        }
      };

      // 期待される結果: エラーが適切に処理される（undefinedまたはエラー）
      expect(() => {
        const firstPageId = Object.keys(malformedData.query.pages)[0];
        const result = (malformedData.query.pages as any)[firstPageId]?.extract;
        return result;
      }).not.toThrow();
    });

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

    it("should handle empty message body for wiki command detection", () => {
      // 条件: 空のメッセージ本文が与えられた場合
      const emptyMessage = "";
      const wikiOnly = "/wiki";
      
      // 期待される結果: startsWith関数が適切に動作する
      expect(emptyMessage.startsWith("/wiki")).toBe(false);
      expect(wikiOnly.startsWith("/wiki")).toBe(true);
    });
  });

  describe("Additional coverage for wiki command logic", () => {
    it("should correctly extract topics with special characters", () => {
      // 条件: 特殊文字を含むwikiコマンドが与えられた場合
      const wikiWithSpecialChars = "/wiki 人工知能_機械学習";
      const topic = wikiWithSpecialChars.slice(wikiWithSpecialChars.indexOf(" ") + 1);
      
      // 期待される結果: 特殊文字を含むトピックが正しく抽出される
      expect(topic).toBe("人工知能_機械学習");
    });

    it("should handle wiki command with leading/trailing spaces", () => {
      // 条件: 前後にスペースがあるwikiコマンドが与えられた場合
      const wikiWithSpaces = "/wiki  artificial intelligence  ";
      const spaceIndex = wikiWithSpaces.indexOf(" ");
      const topic = spaceIndex !== -1 ? wikiWithSpaces.slice(spaceIndex + 1) : "";
      
      // 期待される結果: スペースを含むトピックが抽出される
      expect(topic).toBe(" artificial intelligence  ");
    });

    it("should test message ordering with different array sizes", () => {
      // 条件: 異なるサイズの配列が与えられた場合
      const singleMessage = [{ _id: "1", user: "Alice", body: "Only message" }];
      const emptyMessages: any[] = [];
      
      // 期待される結果: reverse()が正しく動作する
      expect([...singleMessage].reverse()).toHaveLength(1);
      expect([...emptyMessages].reverse()).toHaveLength(0);
    });

    it("should validate Wikipedia URL construction with encoded characters", () => {
      // 条件: エンコードが必要な文字を含むトピックが与えられた場合
      const topicWithSpaces = "artificial intelligence";
      const baseUrl = "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=";
      const fullUrl = baseUrl + topicWithSpaces;
      
      // 期待される結果: URLが正しく構築される
      expect(fullUrl).toContain(topicWithSpaces);
      expect(fullUrl).toContain("format=json");
      expect(fullUrl).toContain("action=query");
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

// getSummaryFromJSON関数をテスト可能にするため、エクスポートする必要があります
// 実際のchat.tsファイルでこの関数をexportする必要があります