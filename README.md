# n8n-nodes-agentmail

This is an n8n community node for [AgentMail](https://agentmail.to) - the Email API for AI Agents.

AgentMail lets you create email inboxes programmatically for your AI agents, so they can send, receive, and act upon emails autonomously.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Features

This node provides two components:

### AgentMail Node (Actions)
- **Inbox**: Create, Get, List, Delete inboxes
- **Message**: Send, Reply, Get, List messages
- **Thread**: Get, List email threads
- **Webhook**: Create, List, Delete webhooks

### AgentMail Trigger (Events)
- **Email Received**: Triggers when an inbox receives an email
- **Email Sent**: Triggers when an email is sent
- **Email Delivered**: Triggers when an email is delivered
- **Email Bounced**: Triggers when an email bounces

## Installation

### Community Node (Recommended)
1. Go to **Settings > Community Nodes**
2. Search for `n8n-nodes-agentmail`
3. Click **Install**

### Manual Installation
```bash
npm install n8n-nodes-agentmail
```

## Credentials

You need an AgentMail API key:
1. Sign up at [agentmail.to](https://agentmail.to)
2. Go to your dashboard
3. Copy your API key
4. In n8n, create new **AgentMail API** credentials

## Example Workflows

We provide detailed, ready-to-use workflow examples. Each includes step-by-step instructions, workflow JSON for easy import, and customization tips.

| Example | Description | Integrations |
|---------|-------------|--------------|
| [Smart Inbox Filter](docs/examples/07-smart-inbox-filter.md) | AI-powered email triage with promo digests | OpenAI, Google Sheets |

<details>
<summary>More examples (archived)</summary>

| Example | Description | Integrations |
|---------|-------------|--------------|
| [AI Auto-Reply](docs/examples/01-ai-auto-reply.md) | Automatically respond to emails using GPT-4 | OpenAI |
| [Email Classification](docs/examples/02-email-classification.md) | Route emails based on AI-detected categories | OpenAI |
| [Lead Capture](docs/examples/03-lead-capture.md) | Extract contact info and save to spreadsheet | OpenAI, Google Sheets |
| [Slack Notifications](docs/examples/04-slack-notifications.md) | Get notified of important emails in Slack | Slack |
| [Daily Summary](docs/examples/05-daily-summary.md) | AI-generated daily email digest | OpenAI, Slack |
| [Support Tickets](docs/examples/06-support-tickets.md) | Auto-create tickets and send confirmations | OpenAI, HTTP/Webhooks |

</details>

### Import Ready-to-Use Workflows

Example workflows are available as importable JSON files in the [`examples/`](examples/) directory:

```
examples/
└── smart-inbox-filter.json     # AI email triage with promo digests
```

Additional example workflows are available in `examples/archive/`.

**To import a workflow:**
1. Download the JSON file from the `examples/` folder
2. In n8n, go to **Workflows → Import from File**
3. Select the downloaded JSON file
4. Configure your credentials (AgentMail, OpenAI, Slack, etc.)
5. Update placeholder values (inbox IDs, channel names, etc.)

### Quick Start: Smart Inbox Filter

Use AgentMail as your primary inbox with AI-powered email triage:

```
PATH 1: Real-time Email Processing
┌─────────────────┐    ┌─────────────┐    ┌─────────────┐
│ AgentMail       │───▶│ OpenAI      │───▶│ Switch      │
│ Trigger         │    │ (Classify)  │    │ (Route)     │
└─────────────────┘    └─────────────┘    └──────┬──────┘
                                              ┌──┴──┐
                                              ▼     ▼
                                         Forward  Store
                                        Important  Promo

PATH 2: Scheduled Digest (every 5 hours)
┌─────────────────┐    ┌─────────────┐    ┌─────────────┐
│ Schedule        │───▶│ Read Promos │───▶│ Summarize   │───▶ Send Digest
│ Trigger         │    │ (Sheets)    │    │ (OpenAI)    │
└─────────────────┘    └─────────────┘    └─────────────┘
```

1. Important emails → Forwarded immediately to your personal inbox
2. Promotional emails → Stored and summarized every 5 hours

See [full documentation](docs/examples/07-smart-inbox-filter.md) for complete setup instructions.

## Node Reference

### Inbox Operations

| Operation | Description |
|-----------|-------------|
| Create | Create a new inbox with a unique email address |
| Get | Retrieve inbox details by ID |
| List | List all inboxes in your account |
| Delete | Delete an inbox permanently |

### Message Operations

| Operation | Description |
|-----------|-------------|
| Send | Send a new email from an inbox |
| Reply | Reply to an existing message thread |
| Get | Retrieve a specific message |
| List | List messages in an inbox |

### Thread Operations

| Operation | Description |
|-----------|-------------|
| Get | Retrieve a thread with all messages |
| List | List threads in an inbox |

### Webhook Operations

| Operation | Description |
|-----------|-------------|
| Create | Register a new webhook URL |
| List | List all registered webhooks |
| Delete | Remove a webhook |

## Trigger Data

When the trigger fires, you receive:

```json
{
  "event": "message.received",
  "eventId": "evt_123",
  "timestamp": "2024-01-25T10:30:00Z",
  "messageId": "msg_456",
  "inboxId": "inbox_789",
  "threadId": "thread_012",
  "from": "sender@example.com",
  "to": ["agent@agentmail.to"],
  "subject": "Hello Agent",
  "text": "Plain text content",
  "html": "<p>HTML content</p>",
  "labels": ["received"],
  "attachments": []
}
```

## Documentation

- [Getting Started Guide](docs/getting-started.md) - Setup and configuration
- [Example Workflows](docs/examples/) - Detailed workflow tutorials

## Resources

- [AgentMail Documentation](https://docs.agentmail.to)
- [AgentMail API Reference](https://docs.agentmail.to/api-reference)
- [n8n Community Forum](https://community.n8n.io)

## License

[MIT](LICENSE.md)

## Author

Created by Joseph Maregn

---

**Note**: This is a community node and is not officially supported by AgentMail or n8n.
