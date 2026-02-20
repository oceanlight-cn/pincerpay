import { TwitterApi } from "twitter-api-v2";
import { getEnv } from "./env.js";

let client: TwitterApi | null = null;

function getTwitterClient(): TwitterApi {
  if (!client) {
    const env = getEnv();
    if (!env.X_API_KEY || !env.X_API_SECRET || !env.X_ACCESS_TOKEN || !env.X_ACCESS_SECRET) {
      throw new Error("X API not configured. Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET in .env");
    }
    client = new TwitterApi({
      appKey: env.X_API_KEY,
      appSecret: env.X_API_SECRET,
      accessToken: env.X_ACCESS_TOKEN,
      accessSecret: env.X_ACCESS_SECRET,
    });
  }
  return client;
}

export async function postTweet(text: string): Promise<{ id: string; url: string }> {
  const api = getTwitterClient();
  const result = await api.v2.tweet(text);
  return {
    id: result.data.id,
    url: `https://x.com/i/status/${result.data.id}`,
  };
}

export async function postThread(tweets: string[]): Promise<{ ids: string[]; url: string }> {
  const api = getTwitterClient();
  const results = await api.v2.tweetThread(tweets);
  const ids = results.map((r) => r.data.id);
  return {
    ids,
    url: `https://x.com/i/status/${ids[0]}`,
  };
}

export async function getTweetMetrics(tweetId: string): Promise<{
  impressions: number;
  likes: number;
  retweets: number;
  replies: number;
}> {
  const api = getTwitterClient();
  const tweet = await api.v2.singleTweet(tweetId, {
    "tweet.fields": ["public_metrics"],
  });

  const metrics = tweet.data.public_metrics;
  return {
    impressions: metrics?.impression_count ?? 0,
    likes: metrics?.like_count ?? 0,
    retweets: metrics?.retweet_count ?? 0,
    replies: metrics?.reply_count ?? 0,
  };
}
