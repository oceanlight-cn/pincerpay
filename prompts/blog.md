# Blog Channel Rules

## Tone
Substantive, opinionated, technically grounded. Every post should teach something or argue something. No filler posts.

## Structure

```markdown
# [Title — clear thesis, not clickbait]

[Opening paragraph: state the thesis or problem directly. No throat-clearing.]

## [Section headers — use aggressively]

[One idea per section. Include code examples in technical posts.]

## Conclusion

[Concrete next step: try it, read the docs, join Discord. One CTA.]
```

## Length
- **Announcements**: 500-800 words
- **Tutorials**: 1000-1500 words
- **Deep dives**: 1500-2500 words
- **Opinion pieces**: 800-1500 words

## Writing Rules
- **First paragraph = thesis.** If the reader reads nothing else, they should know the main point.
- **Code examples must be real.** Use actual PincerPay SDK calls, real USDC amounts, real chain names. No pseudocode.
- **Every claim needs backing.** "99.9% cheaper" needs the math shown. "400ms settlement" needs the chain cited.
- **Use comparison tables** when comparing PincerPay to alternatives. Tables are scannable.
- **Link to docs** whenever referencing a feature. Blog → docs is the primary conversion path.

## Anti-Patterns
- No "In today's rapidly evolving landscape..." openers
- No "We're thrilled to announce..." — just state what shipped
- No thinly-veiled press releases disguised as blog posts
- No feature lists without context — explain WHY each feature matters
- No posts without code examples (for technical posts)

## SEO
- Title should contain primary keyword naturally
- Include 2-3 internal links (to docs, demo, other blog posts)
- Meta description: 150-160 chars, front-loaded with keyword
- Use headers (H2, H3) with keyword variants

## Output Format
Output the full blog post in markdown. Include a frontmatter block:

```yaml
---
title: "Post Title"
description: "150-160 char meta description"
tags: ["tag1", "tag2"]
---
```

Then the full post body in markdown.
