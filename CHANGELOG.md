# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-01-26

### Added
- Workflow screenshots in README for better documentation

## [0.1.0] - 2025-01-26

### Added
- Initial release
- **AgentMail Node** with support for:
  - Inbox operations (create, get, list, delete)
  - Message operations (send, get, list, delete, reply)
  - Thread operations (get, list)
  - Webhook operations (create, get, list, delete)
- **AgentMail Trigger Node** for webhook-based events:
  - Email received (`message.received`)
  - Email sent (`message.sent`)
  - Email delivered (`message.delivered`)
  - Email bounced (`message.bounced`)
- Example workflows:
  - Smart Inbox Filter with AI-powered email triage
- Comprehensive documentation
