import { query, mutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const sendMessage = mutation({
  args: {
    user: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("This TypeScript function is running on the server.");
    await ctx.db.insert("messages", {
      user: args.user,
      body: args.body,
    });
    if (args.body.startsWith("/wiki")) {
      // Get the string after the first space
      const topic = args.body.slice(args.body.indexOf(" ") + 1);
      await ctx.scheduler.runAfter(0, internal.chat.getWikipediaSummary, {
        topic,
      });
    }
  },
});

export const getMessages = query({
  args: {},
  handler: async (ctx) => {
    // Get most recent messages first
    const messages = await ctx.db.query("messages").order("desc").take(50);
    // Reverse the list so that it's in a chronological order.
    return messages.reverse();
  },
});

export const getWikipediaSummary = internalAction({
  args: { topic: v.string() },
  handler: async (ctx, args) => {
    const response = await fetch(
      "https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro&explaintext&redirects=1&titles=" +
        args.topic,
    );

    const summary = getSummaryFromJSON(await response.json());
    await ctx.scheduler.runAfter(0, api.chat.sendMessage, {
      user: "Wikipedia",
      body: summary,
    });  },
});

export function getSummaryFromJSON(data: any) {
  const firstPageId = Object.keys(data.query.pages)[0];
  return data.query.pages[firstPageId].extract;
}

// ヘルパー関数：wikiコマンドの検証とトピック抽出
export function extractWikiTopic(message: string): string | null {
  if (!message.startsWith("/wiki")) {
    return null;
  }
  const spaceIndex = message.indexOf(" ");
  if (spaceIndex === -1) {
    return "";
  }
  return message.slice(spaceIndex + 1);
}

// ヘルパー関数：Wikipedia API URLの生成
export function buildWikipediaUrl(topic: string): string {
  const baseUrl = "https://en.wikipedia.org/w/api.php";
  const params = new URLSearchParams({
    format: "json",
    action: "query",
    prop: "extracts",
    exintro: "true",
    explaintext: "true",
    redirects: "1",
    titles: topic
  });
  return `${baseUrl}?${params.toString()}`;
}