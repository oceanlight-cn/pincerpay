# Status

Last updated: 2026-02-20

## Current Phase

Phase 6: Discord bot — pending

## Completed

- [x] Phase 1: Foundation — types, env, config, content-store, logger
- [x] Phase 2: Content generation — Claude client, prompt system (6 channel prompts), templates, calendar, generate agent
- [x] Phase 3: Review CLI — Commander.js CLI with 7 commands, interactive review TUI
- [x] Phase 4: Publishing — Twitter, Reddit, YouTube, Discord platform clients, publish agent
- [x] Phase 5: Analytics — Analytics agent with metric pulling for all platforms

## In Progress

- [ ] Phase 6: Discord bot (long-running community management bot)
- [ ] Phase 7: Polish (retry logic, rate limiting, README)

## Working Commands

```bash
npx tsx src/cli/index.ts --help         # All commands
npx tsx src/cli/index.ts status         # Pipeline dashboard
npx tsx src/cli/index.ts calendar -w 2026-W09  # View calendar
npx tsx src/cli/index.ts generate --dry-run    # Preview generation
npx tsx src/cli/index.ts generate              # Generate content (needs ANTHROPIC_API_KEY)
npx tsx src/cli/index.ts review                # Interactive review
npx tsx src/cli/index.ts publish --dry-run     # Preview publishing
```

## Blockers

- ANTHROPIC_API_KEY needed in .env for content generation
- Platform API keys needed for publishing (Twitter, Reddit, YouTube, Discord)

## File Count

- 27 TypeScript source files
- 7 prompt files
- 6 content templates
- 4 YAML config files
- Brand voice guide (4,500 words) imported
- 8-week content calendar populated
