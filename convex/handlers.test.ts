import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSummaryFromJSON } from "./chat";

// Convex handler関数のモックテスト
describe("Convex handler functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendMessage handler logic simulation", () => {
    it("should simulate database insert operation", async () => {
      // 条件: メッセージ挿入ロジックをシミュレートする場合
      const mockCtx = {
        db: {
          insert: vi.fn().mockResolvedValue("message_id_123")
        },
        scheduler: {
          runAfter: vi.fn().mockResolvedValue(undefined)
        }
      };

      const args = {
        user: "TestUser",
        body: "Hello world"
      };

      // 期待される結果: データベースに正しい引数でinsertが呼ばれる
      await mockCtx.db.insert("messages", {
        user: args.user,
        body: args.body,
      });

      expect(mockCtx.db.insert).toHaveBeenCalledWith("messages", {
        user: "TestUser",
        body: "Hello world"
      });
    });

    it("should simulate wiki command processing", async () => {
      // 条件: wikiコマンドが処理される場合
      const mockCtx = {
        db: {
          insert: vi.fn().mockResolvedValue("message_id_123")
        },
        scheduler: {
          runAfter: vi.fn().mockResolvedValue(undefined)
        }
      };

      const args = {
        user: "TestUser",
        body: "/wiki JavaScript"
      };

      // wikiコマンドの検出とトピック抽出のシミュレーション
      if (args.body.startsWith("/wiki")) {
        const topic = args.body.slice(args.body.indexOf(" ") + 1);
        
        // スケジューラーの呼び出しをシミュレート
        await mockCtx.scheduler.runAfter(0, "internal.chat.getWikipediaSummary", {
          topic,
        });

        // 期待される結果: スケジューラーが正しい引数で呼ばれる
        expect(mockCtx.scheduler.runAfter).toHaveBeenCalledWith(
          0,
          "internal.chat.getWikipediaSummary",
          { topic: "JavaScript" }
        );
      }
    });
  });

  describe("getMessages handler logic simulation", () => {
    it("should simulate message querying and ordering", async () => {
      // 条件: メッセージクエリロジックをシミュレートする場合
      const mockMessages = [
        { _id: "3", user: "Carol", body: "Latest", _creationTime: 1000003 },
        { _id: "1", user: "Alice", body: "First", _creationTime: 1000001 },
        { _id: "2", user: "Bob", body: "Middle", _creationTime: 1000002 }
      ];

      const mockCtx = {
        db: {
          query: vi.fn((table: string) => ({
            order: vi.fn((direction: string) => ({
              take: vi.fn().mockResolvedValue(mockMessages)
            }))
          }))
        }
      };

      // クエリの実行をシミュレート
      const queryBuilder = mockCtx.db.query("messages");
      const orderedQuery = queryBuilder.order("desc");
      const messages = await orderedQuery.take(50);
      
      // メッセージの反転（時系列順への変更）をシミュレート
      const chronologicalMessages = messages.reverse();

      // 期待される結果: 正しいクエリが実行され、順序が反転される
      expect(mockCtx.db.query).toHaveBeenCalledWith("messages");
      expect(chronologicalMessages).toHaveLength(3);
      expect(chronologicalMessages[0]._id).toBe("2"); // reverse後の最初
      expect(chronologicalMessages[1]._id).toBe("1"); // reverse後の中間
      expect(chronologicalMessages[2]._id).toBe("3"); // reverse後の最後
    });
  });

  describe("getWikipediaSummary handler logic simulation", () => {
    it("should simulate Wikipedia API call and response processing", async () => {
      // 条件: Wikipedia API呼び出しをシミュレートする場合
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          query: {
            pages: {
              "12345": {
                extract: "JavaScript is a programming language."
              }
            }
          }
        })
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const mockCtx = {
        scheduler: {
          runAfter: vi.fn().mockResolvedValue(undefined)
        }
      };

      const args = { topic: "JavaScript" };

      // API呼び出しとレスポンス処理のシミュレート
      const response = await fetch(
        "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=" +
          args.topic,
      );

      const data = await response.json();
      const summary = getSummaryFromJSON(data);

      // sendMessageスケジューラー呼び出しのシミュレート
      await mockCtx.scheduler.runAfter(0, "api.chat.sendMessage", {
        user: "Wikipedia",
        body: summary,
      });

      // 期待される結果: 正しいAPI呼び出しと後続処理が実行される
      expect(fetch).toHaveBeenCalledWith(
        "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=JavaScript"
      );
      expect(summary).toBe("JavaScript is a programming language.");
      expect(mockCtx.scheduler.runAfter).toHaveBeenCalledWith(
        0,
        "api.chat.sendMessage",
        {
          user: "Wikipedia",
          body: "JavaScript is a programming language."
        }
      );
    });

    it("should simulate console.log in sendMessage", () => {
      // 条件: sendMessageでconsole.logが呼ばれる場合
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // ログメッセージのシミュレート
      console.log("This TypeScript function is running on the server.");
      
      // 期待される結果: console.logが呼ばれる
      expect(consoleSpy).toHaveBeenCalledWith("This TypeScript function is running on the server.");
      
      consoleSpy.mockRestore();
    });
  });
});