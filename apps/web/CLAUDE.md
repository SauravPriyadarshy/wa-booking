@AGENTS.md

## Project context

WhatsApp Business Assistant monorepo. See root [`README.md`](../../README.md) and [`.cursor/rules/project-overview.mdc`](../../.cursor/rules/project-overview.mdc).

- Web runs on port **3001** (not 3000)
- API on **3000** · use `NEXT_PUBLIC_API_URL` for fetches
- i18n: `messages/{en,hi}.json` · never hardcode UI strings
- Mobile-first · emerald/zinc palette · bottom nav in `/app`
- Money as integer cents · display with `en-IN` locale
