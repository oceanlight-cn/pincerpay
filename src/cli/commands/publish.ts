import type { Command } from "commander";
import dayjs from "dayjs";
import { confirm } from "@inquirer/prompts";
import { listContent, moveContent } from "../../lib/content-store.js";
import { isChannelConfigured } from "../../lib/env.js";
import { log } from "../../lib/logger.js";
import type { Channel, ContentFile, PlatformPublishResult } from "../../types/index.js";

export function registerPublishCommand(program: Command): void {
  program
    .command("publish")
    .description("Publish approved content to platforms")
    .option("-c, --channel <channel>", "Filter by channel")
    .option("--id <id>", "Publish specific content by ID")
    .option("--scheduled", "Only publish items where scheduled_for <= now")
    .option("--dry-run", "Show what would be published without calling APIs")
    .option("-y, --yes", "Skip confirmation prompt")
    .option("-v, --verbose", "Verbose output")
    .action(async (opts) => {
      try {
        const channel = opts.channel as Channel | undefined;
        let items = listContent("approved", { channel });

        if (opts.id) {
          items = items.filter((i) => i.frontmatter.id === opts.id);
        }

        if (opts.scheduled) {
          items = items.filter(
            (i) =>
              i.frontmatter.scheduled_for &&
              dayjs(i.frontmatter.scheduled_for).isBefore(dayjs())
          );
        }

        if (items.length === 0) {
          log.info("No approved content ready to publish.");
          return;
        }

        log.header(`Publishing ${items.length} item(s)`);

        for (const item of items) {
          console.log(
            `  ${log.channel(item.frontmatter.channel)} ${item.frontmatter.type}: ${item.frontmatter.title.slice(0, 60)}`
          );
        }
        console.log();

        if (opts.dryRun) {
          log.info("[dry-run] Would publish the items listed above.");
          return;
        }

        if (!opts.yes) {
          const confirmed = await confirm({
            message: `Publish ${items.length} item(s)?`,
          });
          if (!confirmed) {
            log.info("Cancelled.");
            return;
          }
        }

        let published = 0;
        let failed = 0;

        for (const item of items) {
          const result = await publishItem(item, opts.verbose ?? false);
          if (result.success) {
            moveContent(item.filepath, "published", {
              platform_id: result.platform_id ?? null,
              platform_url: result.platform_url ?? null,
              published_at: dayjs().toISOString(),
            });
            log.success(`Published: ${item.frontmatter.id} → ${result.platform_url ?? "done"}`);
            published++;
          } else {
            log.error(`Failed: ${item.frontmatter.id} — ${result.error}`);
            failed++;
          }
        }

        console.log();
        log.info(`Published: ${published} | Failed: ${failed}`);
      } catch (error) {
        log.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
}

async function publishItem(item: ContentFile, verbose: boolean): Promise<PlatformPublishResult> {
  const { channel } = item.frontmatter;

  if (!isChannelConfigured(channel)) {
    return {
      success: false,
      error: `${channel} API not configured. Set keys in .env`,
    };
  }

  try {
    switch (channel) {
      case "twitter":
        return await publishToTwitter(item, verbose);
      case "reddit":
        return await publishToReddit(item, verbose);
      case "youtube":
        return await publishToYouTube(item, verbose);
      case "discord":
        return await publishToDiscord(item, verbose);
      case "blog":
        return { success: true, platform_url: "local" };
      default:
        return { success: false, error: `Unknown channel: ${channel}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function publishToTwitter(item: ContentFile, verbose: boolean): Promise<PlatformPublishResult> {
  const { postTweet, postThread } = await import("../../lib/twitter.js");

  if (item.frontmatter.type === "thread") {
    const tweets = item.body
      .split(/^## Tweet \d+\/\d+$/m)
      .map((t) => t.trim())
      .filter(Boolean);

    log.verbose(`  Posting thread with ${tweets.length} tweets`, verbose);
    const result = await postThread(tweets);
    return { success: true, platform_id: result.ids[0], platform_url: result.url };
  } else {
    log.verbose(`  Posting tweet: ${item.body.slice(0, 50)}...`, verbose);
    const result = await postTweet(item.body.trim());
    return { success: true, platform_id: result.id, platform_url: result.url };
  }
}

async function publishToReddit(item: ContentFile, verbose: boolean): Promise<PlatformPublishResult> {
  const { submitPost } = await import("../../lib/reddit.js");

  // Parse title and body from reddit-post format
  const titleMatch = item.body.match(/^## Title\n(.+)/m);
  const bodyMatch = item.body.match(/^## Body\n([\s\S]+?)(?=^## |$)/m);

  const title = titleMatch?.[1]?.trim() ?? item.frontmatter.title;
  const body = bodyMatch?.[1]?.trim() ?? item.body;
  const subreddit = item.frontmatter.subreddit ?? "solana";

  log.verbose(`  Posting to r/${subreddit}: "${title.slice(0, 50)}..."`, verbose);
  const result = await submitPost(subreddit, title, body);
  return { success: true, platform_id: result.id, platform_url: result.url };
}

async function publishToYouTube(item: ContentFile, _verbose: boolean): Promise<PlatformPublishResult> {
  // YouTube descriptions are generated but video upload is manual
  return {
    success: true,
    platform_url: "manual-upload-required",
  };
}

async function publishToDiscord(item: ContentFile, verbose: boolean): Promise<PlatformPublishResult> {
  const { sendAnnouncement } = await import("../../lib/discord.js");

  log.verbose(`  Sending Discord announcement`, verbose);
  const result = await sendAnnouncement(item.body.trim());
  return { success: true, platform_id: result.id, platform_url: result.url };
}
