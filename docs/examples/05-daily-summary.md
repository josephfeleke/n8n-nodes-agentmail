# Example: Daily Email Summary

Get an AI-generated summary of all emails received in the past 24 hours, delivered to Slack.

## What You'll Build

```
Schedule Trigger (9am daily) → AgentMail (List Messages) → OpenAI (Summarize) → Slack (Post)
```

This workflow:
- Runs automatically every morning
- Fetches all emails from the past 24 hours
- Uses AI to create a concise summary
- Posts the digest to a Slack channel

## Prerequisites

- AgentMail API key
- OpenAI API key
- Slack Bot Token (with `chat:write` scope)
- An inbox with some emails to summarize

## Step-by-Step Setup

### Step 1: Create the Scheduled Workflow

#### Add Schedule Trigger

1. Create workflow named "Daily Email Summary"
2. Add **Schedule Trigger** node
3. Configure:
   - **Trigger Times**: Add Trigger Time
   - **Mode**: Every Day
   - **Hour**: 9
   - **Minute**: 0
   - **Timezone**: Your timezone

#### Add AgentMail List Messages Node

1. Add **AgentMail** node
2. Configure:
   - **Resource**: Message
   - **Operation**: List
   - **Inbox ID**: Your inbox ID
   - **Limit**: 50 (adjust as needed)

#### Add Code Node (Filter Last 24 Hours)

1. Add **Code** node
2. JavaScript:

```javascript
const messages = $input.all();
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

const recentMessages = messages.filter(msg => {
  const msgDate = new Date(msg.json.created_at || msg.json.timestamp);
  return msgDate > oneDayAgo;
});

if (recentMessages.length === 0) {
  return [{ noMessages: true, summary: 'No new emails in the last 24 hours.' }];
}

// Format messages for AI summarization
const formatted = recentMessages.map(msg => ({
  from: msg.json.from,
  subject: msg.json.subject,
  preview: (msg.json.text || '').substring(0, 200),
  time: msg.json.created_at || msg.json.timestamp
}));

return [{
  noMessages: false,
  messageCount: recentMessages.length,
  messages: formatted,
  messagesText: formatted.map(m =>
    `From: ${m.from}\nSubject: ${m.subject}\nPreview: ${m.preview}\n---`
  ).join('\n\n')
}];
```

#### Add IF Node (Skip if No Messages)

1. Add **IF** node
2. Condition: `{{ $json.noMessages }}` equals `false`

#### Add OpenAI Summarization Node

1. Add **OpenAI** node (connected to TRUE branch)
2. Configure:

**System Message:**
```
You are an email digest assistant. Create a concise daily summary of emails.

Format your response like this:

📊 **Daily Email Summary**
Total: X emails

🔴 **Requires Action** (urgent items)
- Item 1
- Item 2

📋 **For Your Review**
- Item 3
- Item 4

ℹ️ **Informational**
- Item 5

Keep it brief and scannable. Highlight anything that needs immediate attention.
```

**User Message:**
```
Summarize these {{ $json.messageCount }} emails from the last 24 hours:

{{ $json.messagesText }}
```

#### Add Slack Node

1. Add **Slack** node
2. Configure:
   - **Channel**: #daily-digest (or your channel)
   - **Text**: `{{ $json.message.content }}`

#### Add Slack Node for No Messages (Optional)

Connect a second Slack node to the FALSE branch:
- **Text**: "📭 No new emails in the last 24 hours!"

### Step 2: Activate and Test

1. Save the workflow
2. Click **Execute Workflow** to test manually
3. Once working, toggle to **Active**

## Enhanced Features

### Include Email Statistics

Add analytics to your summary:

```javascript
const messages = $input.all();

// Group by sender domain
const senderDomains = {};
messages.forEach(msg => {
  const domain = msg.json.from.split('@')[1];
  senderDomains[domain] = (senderDomains[domain] || 0) + 1;
});

// Find most active sender
const topSender = Object.entries(senderDomains)
  .sort((a, b) => b[1] - a[1])[0];

// Calculate response rate (if you track sent messages)
const stats = {
  totalReceived: messages.length,
  uniqueSenders: Object.keys(senderDomains).length,
  topSender: topSender ? `${topSender[0]} (${topSender[1]} emails)` : 'N/A'
};

return [{ ...stats, messages }];
```

### Weekly Summary Option

Modify the schedule and filter:

```javascript
// Change to weekly
const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
```

And update the schedule trigger to run weekly.

### Priority-Based Summary

Ask AI to categorize by priority:

```
Categorize emails by priority:

🔴 URGENT - Needs response today
🟡 IMPORTANT - Needs response this week
🟢 NORMAL - Can wait
⚪ LOW - Informational only

For each email, indicate the priority and a brief summary.
```

### Multi-Inbox Summary

If you have multiple inboxes:

```javascript
const inboxes = ['inbox1@agentmail.to', 'inbox2@agentmail.to'];

// Fetch from each inbox and combine
const allMessages = [];
for (const inbox of inboxes) {
  const messages = await fetchMessagesFromInbox(inbox);
  allMessages.push(...messages.map(m => ({...m, inbox})));
}

return [{ messages: allMessages }];
```

## Workflow JSON

```json
{
  "name": "Daily Email Summary",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{
            "triggerAtHour": 9
          }]
        }
      },
      "name": "Schedule",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "list",
        "inboxId": "your-inbox@agentmail.to",
        "limit": 50
      },
      "name": "Get Messages",
      "type": "n8n-nodes-agentmail.agentMail",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "// Filter and format messages code here"
      },
      "name": "Filter & Format",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "Create a concise daily email summary..."
            },
            {
              "role": "user",
              "content": "Summarize: {{ $json.messagesText }}"
            }
          ]
        }
      },
      "name": "Summarize",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [850, 300]
    },
    {
      "parameters": {
        "channel": "#daily-digest",
        "text": "={{ $json.message.content }}"
      },
      "name": "Post to Slack",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 2,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "Schedule": {
      "main": [[{ "node": "Get Messages", "type": "main", "index": 0 }]]
    },
    "Get Messages": {
      "main": [[{ "node": "Filter & Format", "type": "main", "index": 0 }]]
    },
    "Filter & Format": {
      "main": [[{ "node": "Summarize", "type": "main", "index": 0 }]]
    },
    "Summarize": {
      "main": [[{ "node": "Post to Slack", "type": "main", "index": 0 }]]
    }
  }
}
```

## Example Output

```
📊 **Daily Email Summary**
Total: 12 emails

🔴 **Requires Action**
- Client ABC requesting urgent support for login issues
- Invoice #1234 needs approval by EOD

📋 **For Your Review**
- Proposal feedback from Marketing team
- New lead inquiry about enterprise plan
- Meeting request for Thursday

ℹ️ **Informational**
- Newsletter from Industry News
- Automated reports (3 emails)
- Calendar confirmations (2 emails)

_Summary generated at 9:00 AM_
```

## Troubleshooting

### No messages being fetched?

- Verify inbox ID is correct
- Check AgentMail credentials
- Ensure messages exist in the time range

### Schedule not running?

- Make sure workflow is **Active**
- Check timezone settings
- Review execution history

### Summary too long for Slack?

- Limit to fewer messages
- Ask AI for more concise summaries
- Split into multiple messages

## Related Examples

- [Slack Notifications](04-slack-notifications.md) - Real-time alerts
- [Lead Capture](03-lead-capture.md) - Track leads from emails
