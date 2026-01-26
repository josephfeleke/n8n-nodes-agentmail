# Example: Slack Notifications for Important Emails

Get instant Slack notifications when important emails arrive in your AgentMail inbox.

## What You'll Build

```
AgentMail Trigger (Email Received) → IF Node (Filter VIP) → Slack (Send Message)
```

This workflow:
- Monitors your AgentMail inbox for new emails
- Filters for emails from VIP senders or with important keywords
- Sends a formatted notification to your Slack channel

## Prerequisites

- AgentMail API key ([get one here](https://agentmail.to/dashboard))
- Slack workspace with a channel for notifications
- Slack Bot Token (see setup below)

## Step-by-Step Setup

### Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** > **From scratch**
3. Name it "Email Notifications" and select your workspace
4. Go to **OAuth & Permissions**
5. Under **Scopes > Bot Token Scopes**, add:
   - `chat:write`
   - `chat:write.public`
6. Click **Install to Workspace**
7. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### Step 2: Create the Workflow in n8n

#### Add AgentMail Trigger

1. Create a new workflow
2. Add **AgentMail Trigger** node
3. Configure:
   - **Credential**: Select your AgentMail API credentials
   - **Event**: Email Received
   - **Inbox Filter**: (optional) Your specific inbox ID

#### Add IF Node for Filtering

1. Add an **IF** node after the trigger
2. Configure conditions (example: VIP sender filter):
   ```
   {{ $json.from }} contains "@important-client.com"
   ```

   Or filter by subject keywords:
   ```
   {{ $json.subject }} contains "URGENT"
   ```

#### Add Slack Node

1. Add a **Slack** node
2. Configure:
   - **Credential**: Add your Slack Bot Token
   - **Resource**: Message
   - **Operation**: Send
   - **Channel**: #email-notifications (or your channel)
   - **Text**:
   ```
   :email: *New Email Received*

   *From:* {{ $json.from }}
   *Subject:* {{ $json.subject }}
   *Preview:* {{ $json.text.substring(0, 200) }}...

   _Received at {{ $json.timestamp }}_
   ```

### Step 3: Activate the Workflow

1. Click **Save**
2. Toggle the workflow to **Active**
3. Your webhook is now registered with AgentMail

## Testing

1. Send an email to your AgentMail inbox from a VIP address
2. Check your Slack channel for the notification
3. Verify all fields are populated correctly

## Customization Ideas

### Multiple VIP Lists

Use a Code node to check against a list:

```javascript
const vipDomains = ['client1.com', 'client2.com', 'partner.com'];
const senderDomain = $json.from.split('@')[1];
return [{ isVip: vipDomains.includes(senderDomain), ...$json }];
```

### Priority-Based Channels

Route to different Slack channels based on content:

```
URGENT emails → #urgent-alerts
Regular VIP emails → #email-notifications
All others → (no notification)
```

### Rich Formatting

Use Slack Block Kit for richer notifications:

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "New Email Received"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*From:*\n{{ $json.from }}"
        },
        {
          "type": "mrkdwn",
          "text": "*Subject:*\n{{ $json.subject }}"
        }
      ]
    }
  ]
}
```

## Workflow JSON

Import this workflow directly into n8n:

```json
{
  "name": "AgentMail Slack Notifications",
  "nodes": [
    {
      "parameters": {
        "event": "message.received"
      },
      "name": "AgentMail Trigger",
      "type": "n8n-nodes-agentmail.agentMailTrigger",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "agentMailApi": {
          "id": "YOUR_CREDENTIAL_ID",
          "name": "AgentMail account"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.from }}",
              "operation": "contains",
              "value2": "@"
            }
          ]
        }
      },
      "name": "Filter VIP",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "channel": "#email-notifications",
        "text": ":email: *New Email*\n\n*From:* {{ $json.from }}\n*Subject:* {{ $json.subject }}\n*Preview:* {{ $json.text }}"
      },
      "name": "Slack",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2,
      "position": [650, 300],
      "credentials": {
        "slackApi": {
          "id": "YOUR_SLACK_CREDENTIAL_ID",
          "name": "Slack account"
        }
      }
    }
  ],
  "connections": {
    "AgentMail Trigger": {
      "main": [
        [
          {
            "node": "Filter VIP",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter VIP": {
      "main": [
        [
          {
            "node": "Slack",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Troubleshooting

### Not receiving notifications?

1. Check that the workflow is **Active**
2. Verify the email matches your filter conditions
3. Ensure the Slack bot is in the target channel
4. Check n8n execution logs for errors

### Slack permission errors?

- Reinstall the Slack app to your workspace
- Ensure `chat:write` and `chat:write.public` scopes are added
- For private channels, invite the bot first: `/invite @YourBot`

## Related Examples

- [AI Auto-Reply](01-ai-auto-reply.md) - Respond to emails automatically
- [Email Classification](02-email-classification.md) - Route emails by category
