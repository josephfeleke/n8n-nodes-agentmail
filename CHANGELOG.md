# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-12

### Added
- **Dynamic inbox dropdown** on all inbox fields — pick from a list instead of typing IDs
- **Return All / Limit** pagination on all list operations with cursor-based page fetching
- **AI agent support** — both nodes are now usable as tools in n8n AI Agent workflows
- **Notice banner** linking to the API key dashboard for quick onboarding
- **Hint text** on the username field showing the resulting email format
- **Trigger panel** with activation hints and help text explaining how events work
- **HTML editor** for the HTML body field with syntax highlighting
- **Codex metadata** files for n8n marketplace categorization and search
- **Search aliases** — node appears when searching "email", "mail", "inbox", "ai agent", etc.
- **GitHub Actions CI** — lint and build run on every PR and push
- **GitHub Actions publish** — automated npm publishing with provenance on version tags
- **Prettier config** matching n8n's official code style

### Changed
- **Simplified Inbox Create** — only shows Username; Display Name and Domain are in Additional Fields
- **Simplified Message Send/Reply** — only shows Message field; HTML Body is in Options
- **Renamed "Body (Text)" to "Message"** for clarity
- **Improved error handling** — uses NodeApiError for better HTTP error display in the n8n UI
- **Uses NodeConnectionTypes.Main** constant instead of string literals
- **All dropdown options sorted alphabetically** per n8n linter requirements
- **Updated tsconfig.json** to match n8n starter template (stricter checks, source maps)
- **Simplified npm package** — only ships dist/ (npm auto-includes README and LICENSE)
- **Added `strict: true`** to the n8n config field for stricter validation

### Fixed
- Removed unused variable in trigger node
- Added missing `required: true` on the username field for inbox creation

## [0.1.1] - 2025-01-26

### Added
- Workflow screenshots in README for better documentation

## [0.1.0] - 2025-01-26

### Added
- Initial release
- **AgentMail Node** with support for:
  - Inbox operations (create, get, list, delete)
  - Message operations (send, get, list, reply)
  - Thread operations (get, list)
  - Webhook operations (create, list, delete)
- **AgentMail Trigger Node** for webhook-based events:
  - Email received (`message.received`)
  - Email sent (`message.sent`)
  - Email delivered (`message.delivered`)
  - Email bounced (`message.bounced`)
- Example workflows:
  - Smart Inbox Filter with AI-powered email triage
- Comprehensive documentation
