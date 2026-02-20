import Snoowrap from "snoowrap";
import { getEnv } from "./env.js";

let client: Snoowrap | null = null;

function getRedditClient(): Snoowrap {
  if (!client) {
    const env = getEnv();
    if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET || !env.REDDIT_USERNAME || !env.REDDIT_PASSWORD) {
      throw new Error("Reddit API not configured. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD in .env");
    }
    client = new Snoowrap({
      userAgent: env.REDDIT_USER_AGENT,
      clientId: env.REDDIT_CLIENT_ID,
      clientSecret: env.REDDIT_CLIENT_SECRET,
      username: env.REDDIT_USERNAME,
      password: env.REDDIT_PASSWORD,
    });
  }
  return client;
}

export async function submitPost(
  subreddit: string,
  title: string,
  body: string
): Promise<{ id: string; url: string }> {
  const r = getRedditClient();
  const submission = await (r.submitSelfpost({
    subredditName: subreddit,
    title,
    text: body,
  }) as unknown as Promise<{ name: string; permalink: string }>);
  return {
    id: submission.name,
    url: `https://reddit.com${submission.permalink}`,
  };
}

export async function getPostMetrics(postId: string): Promise<{
  upvotes: number;
  comments: number;
  upvote_ratio: number;
}> {
  const r = getRedditClient();
  const submission = await (r.getSubmission(postId).fetch() as unknown as Promise<{
    score: number;
    num_comments: number;
    upvote_ratio: number;
  }>);
  return {
    upvotes: submission.score,
    comments: submission.num_comments,
    upvote_ratio: submission.upvote_ratio,
  };
}
