# Getting Started with AgentMail n8n Node

This guide will help you set up and use the AgentMail n8n node to build email automation workflows for your AI agents.

## Prerequisites

1. **n8n instance** - Either self-hosted or n8n cloud
2. **AgentMail account** - Sign up at [agentmail.to](https://agentmail.to)
3. **AgentMail API key** - Get it from your [AgentMail dashboard](https://agentmail.to/dashboard)

## Installation

### Option 1: Community Nodes (Recommended)

1. In n8n, go to **Settings > Community Nodes**
2. Click **Install**
3. Enter `n8n-nodes-agentmail`
4. Click **Install**

### Option 2: Manual Installation

```bash
npm install n8n-nodes-agentmail
```

## Setting Up Credentials

1. In n8n, go to **Credentials**
2. Click **Add Credential**
3. Search for **AgentMail API**
4. Enter your API key from the AgentMail dashboard
5. Click **Save**
6. Test the connection by clicking **Test**

## Creating Your First Inbox

Before you can receive emails, you need to create an inbox:

1. Add an **AgentMail** node to your workflow
2. Select **Inbox** as the Resource
3. Select **Create** as the Operation
4. Optionally set a custom username (or leave blank for auto-generated)
5. Execute the node

Your inbox email address will be in the format: `username@agentmail.to`

## Setting Up a Trigger

To respond to incoming emails:

1. Add an **AgentMail Trigger** node
2. Select the event type (e.g., "Email Received")
3. Optionally filter by inbox ID
4. Connect additional nodes to process the email

## Node Capabilities

### AgentMail Node (Actions)

| Resource | Operations |
|----------|------------|
| Inbox | Create, Get, List, Delete |
| Message | Send, Reply, Get, List |
| Thread | Get, List |
| Webhook | Create, List, Delete |

### AgentMail Trigger (Events)

| Event | Description |
|-------|-------------|
| Email Received | Triggers when an email arrives |
| Email Sent | Triggers when an email is sent |
| Email Delivered | Triggers on successful delivery |
| Email Bounced | Triggers when delivery fails |

## Trigger Output Data

When an email is received, the trigger provides:

```json
{
  "event": "message.received",
  "eventId": "evt_abc123",
  "timestamp": "2024-01-25T10:30:00Z",
  "messageId": "msg_xyz789",
  "inboxId": "your-inbox@agentmail.to",
  "threadId": "thread_def456",
  "from": "sender@example.com",
  "to": ["your-inbox@agentmail.to"],
  "subject": "Hello",
  "text": "Plain text content",
  "html": "<p>HTML content</p>",
  "labels": ["received"],
  "attachments": [],
  "rawPayload": { /* full webhook payload */ }
}
```

## Next Steps

Check out the [example workflows](examples/) to see AgentMail in action:

1. [AI Auto-Reply Agent](examples/01-ai-auto-reply.md) - Automatically respond to emails using AI
2. [Email Classification](examples/02-email-classification.md) - Route emails based on content
3. [Lead Capture](examples/03-lead-capture.md) - Extract contact info to Google Sheets
4. [Slack Notifications](examples/04-slack-notifications.md) - Get notified of important emails
5. [Daily Summary](examples/05-daily-summary.md) - AI-generated email digests
6. [Support Tickets](examples/06-support-tickets.md) - Auto-create tickets from emails

## Troubleshooting

### Webhook not triggering?

- Ensure your n8n instance is publicly accessible (use ngrok for local development)
- Set the `WEBHOOK_URL` environment variable to your public URL
- Verify the webhook was registered in AgentMail dashboard

### Connection test failing?

- Double-check your API key
- Ensure there are no extra spaces in the key
- Verify your AgentMail account is active

## Support

- [AgentMail Documentation](https://docs.agentmail.to)
- [n8n Community Forum](https://community.n8n.io)
- [GitHub Issues](https://github.com/your-repo/n8n-nodes-agentmail/issues)
