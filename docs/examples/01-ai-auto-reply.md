# Example: AI Auto-Reply Agent

Build an intelligent email agent that automatically responds to incoming emails using OpenAI.

## What You'll Build

```
AgentMail Trigger (Email Received) → OpenAI (Generate Reply) → AgentMail (Reply to Thread)
```

This workflow:
- Receives emails in your AgentMail inbox
- Uses GPT-4 to generate contextual responses
- Automatically replies to the sender

## Prerequisites

- AgentMail API key ([get one here](https://agentmail.to/dashboard))
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))
- An AgentMail inbox created

## Step-by-Step Setup

### Step 1: Create an AgentMail Inbox

If you haven't already:

1. Create a workflow with an **AgentMail** node
2. Set Resource: **Inbox**, Operation: **Create**
3. Execute to create your inbox (e.g., `my-agent@agentmail.to`)

### Step 2: Create the Auto-Reply Workflow

#### Add AgentMail Trigger

1. Create a new workflow named "AI Auto-Reply Agent"
2. Add **AgentMail Trigger** node
3. Configure:
   - **Event**: Email Received
   - **Inbox Filter**: (optional) Your inbox ID

#### Add OpenAI Node

1. Add an **OpenAI** node
2. Configure:
   - **Credential**: Add your OpenAI API key
   - **Resource**: Chat
   - **Operation**: Complete
   - **Model**: gpt-4 (or gpt-3.5-turbo for lower cost)
   - **Messages**:

**System Message:**
```
You are a helpful AI assistant responding to emails. Be professional, friendly, and concise.
Sign off as "AI Assistant" and mention that this is an automated response.
Keep responses under 200 words unless the question requires a detailed answer.
```

**User Message:**
```
Please write a reply to this email:

From: {{ $json.from }}
Subject: {{ $json.subject }}

Email content:
{{ $json.text }}

---
Write a helpful, professional response.
```

#### Add AgentMail Reply Node

1. Add an **AgentMail** node
2. Configure:
   - **Resource**: Message
   - **Operation**: Reply
   - **Thread ID**: `{{ $('AgentMail Trigger').item.json.threadId }}`
   - **Text**: `{{ $json.message.content }}`

### Step 3: Connect and Activate

1. Connect: Trigger → OpenAI → AgentMail Reply
2. Save the workflow
3. Toggle to **Active**

## Testing

1. Send an email to your AgentMail inbox:
   ```
   To: my-agent@agentmail.to
   Subject: Question about your services
   Body: Hi, I'd like to know more about your pricing plans.
   ```

2. Wait a few seconds for processing

3. Check your sent folder - you should see the AI-generated reply

## Example Responses

**Incoming Email:**
```
Subject: Meeting Request
Body: Hi, can we schedule a call next week to discuss the project?
```

**AI Response:**
```
Hi,

Thank you for reaching out! I'd be happy to help arrange a meeting to discuss the project.

Could you please let me know your availability next week? I can work around your schedule to find a time that works best.

Looking forward to connecting!

Best regards,
AI Assistant

(This is an automated response)
```

## Advanced Configuration

### Add Context About Your Business

Enhance the system prompt with specific information:

```
You are an AI assistant for Acme Corp, a software development company.

Key information:
- We offer web and mobile app development
- Pricing starts at $5,000 for small projects
- Typical project timeline is 4-8 weeks
- Contact sales@acme.com for detailed quotes

Respond professionally and direct complex inquiries to the appropriate team.
```

### Filter Before Replying

Add an IF node to only reply to certain emails:

```javascript
// Don't reply to:
// - Automated emails (no-reply addresses)
// - Emails already replied to
// - Spam patterns

const from = $json.from.toLowerCase();
const subject = $json.subject.toLowerCase();

const skipPatterns = [
  'no-reply',
  'noreply',
  'automated',
  'unsubscribe'
];

const shouldReply = !skipPatterns.some(p =>
  from.includes(p) || subject.includes(p)
);

return [{ shouldReply, ...$json }];
```

### Add Delay Before Replying

Make responses feel more natural by adding a Wait node:

```
Trigger → Wait (30-60 seconds random) → OpenAI → Reply
```

### Log Conversations

Add a Google Sheets node to track all interactions:

```
Trigger → OpenAI → [Google Sheets + Reply] (parallel)
```

## Workflow JSON

```json
{
  "name": "AI Auto-Reply Agent",
  "nodes": [
    {
      "parameters": {
        "event": "message.received"
      },
      "name": "AgentMail Trigger",
      "type": "n8n-nodes-agentmail.agentMailTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "model": "gpt-4",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "You are a helpful AI assistant responding to emails. Be professional, friendly, and concise."
            },
            {
              "role": "user",
              "content": "Reply to this email:\n\nFrom: {{ $json.from }}\nSubject: {{ $json.subject }}\n\n{{ $json.text }}"
            }
          ]
        }
      },
      "name": "OpenAI",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "reply",
        "threadId": "={{ $('AgentMail Trigger').item.json.threadId }}",
        "text": "={{ $json.message.content }}"
      },
      "name": "Reply",
      "type": "n8n-nodes-agentmail.agentMail",
      "typeVersion": 1,
      "position": [650, 300]
    }
  ],
  "connections": {
    "AgentMail Trigger": {
      "main": [[{ "node": "OpenAI", "type": "main", "index": 0 }]]
    },
    "OpenAI": {
      "main": [[{ "node": "Reply", "type": "main", "index": 0 }]]
    }
  }
}
```

## Cost Considerations

- **GPT-4**: ~$0.03-0.06 per email (more accurate)
- **GPT-3.5-turbo**: ~$0.002 per email (faster, cheaper)

For high-volume inboxes, consider GPT-3.5-turbo or implementing rate limiting.

## Troubleshooting

### AI responses are too generic?

- Add more context in the system prompt
- Include your business information
- Provide example responses

### Reply not sending?

- Verify the Thread ID is being passed correctly
- Check that your inbox has permission to reply
- Look at n8n execution logs for errors

### Webhook not triggering?

- Ensure n8n is publicly accessible
- Set `WEBHOOK_URL` environment variable
- Verify webhook is registered in AgentMail

## Related Examples

- [Email Classification](02-email-classification.md) - Route emails before replying
- [Support Tickets](06-support-tickets.md) - Create tickets and auto-acknowledge
