# Example: Email Classification & Routing

Automatically classify incoming emails and route them to different workflows based on their content.

## What You'll Build

```
AgentMail Trigger → OpenAI (Classify) → Switch Node → Different Actions
                                              ├── Support → Create Ticket
                                              ├── Sales → Add to CRM
                                              └── Spam → Archive
```

This workflow:
- Analyzes incoming emails using AI
- Classifies them into categories (support, sales, general, spam)
- Routes each category to appropriate handling

## Prerequisites

- AgentMail API key
- OpenAI API key
- (Optional) Additional integrations for each route

## Step-by-Step Setup

### Step 1: Create the Classification Workflow

#### Add AgentMail Trigger

1. Create a new workflow named "Email Router"
2. Add **AgentMail Trigger** with Event: **Email Received**

#### Add OpenAI Classification Node

1. Add an **OpenAI** node
2. Configure for classification:

**System Message:**
```
You are an email classifier. Analyze the email and respond with ONLY one of these categories:
- SUPPORT: Technical issues, bugs, help requests
- SALES: Pricing inquiries, purchase interest, quotes
- GENERAL: General questions, feedback, information requests
- SPAM: Marketing, newsletters, automated messages

Respond with just the category name, nothing else.
```

**User Message:**
```
Classify this email:

From: {{ $json.from }}
Subject: {{ $json.subject }}

{{ $json.text }}
```

#### Add Switch Node

1. Add a **Switch** node after OpenAI
2. Configure routing rules:

| Rule Name | Condition |
|-----------|-----------|
| Support | `{{ $json.message.content }}` equals `SUPPORT` |
| Sales | `{{ $json.message.content }}` equals `SALES` |
| General | `{{ $json.message.content }}` equals `GENERAL` |
| Spam | `{{ $json.message.content }}` equals `SPAM` |

#### Add Route-Specific Actions

**Support Route:**
- Create a ticket in your ticketing system
- Send acknowledgment email

**Sales Route:**
- Add to CRM or Google Sheets
- Notify sales team via Slack

**General Route:**
- Queue for AI auto-reply
- Or forward to appropriate inbox

**Spam Route:**
- Archive/delete the email
- No notification needed

### Step 2: Example Route Implementations

#### Support Route - HTTP Request to Ticketing System

```json
{
  "method": "POST",
  "url": "https://api.yourtickets.com/tickets",
  "headers": {
    "Authorization": "Bearer YOUR_TOKEN"
  },
  "body": {
    "title": "{{ $('AgentMail Trigger').item.json.subject }}",
    "description": "{{ $('AgentMail Trigger').item.json.text }}",
    "customer_email": "{{ $('AgentMail Trigger').item.json.from }}",
    "priority": "normal"
  }
}
```

#### Sales Route - Google Sheets

Add to a leads spreadsheet:
- Column A: Date (`{{ $now }}`)
- Column B: Email (`{{ $json.from }}`)
- Column C: Subject (`{{ $json.subject }}`)
- Column D: Message Preview (`{{ $json.text.substring(0, 500) }}`)

#### Spam Route - Archive (No Action)

Simply don't connect any node, or add a "No Operation" node for clarity.

## Enhanced Classification

### Add Confidence Scores

Modify the prompt to return structured data:

```
Classify this email and rate your confidence (0-100):

Respond in this exact format:
CATEGORY: [category]
CONFIDENCE: [number]
REASON: [brief explanation]
```

Then use a Code node to parse:

```javascript
const response = $json.message.content;
const lines = response.split('\n');

return [{
  category: lines[0].replace('CATEGORY: ', ''),
  confidence: parseInt(lines[1].replace('CONFIDENCE: ', '')),
  reason: lines[2].replace('REASON: ', ''),
  originalEmail: $('AgentMail Trigger').item.json
}];
```

### Priority Detection

Extend classification to include priority:

```
Categories: SUPPORT, SALES, GENERAL, SPAM
Priorities: URGENT, HIGH, NORMAL, LOW

URGENT indicators:
- Words like "urgent", "asap", "emergency", "down", "broken"
- Customer is a known VIP (check domain)
- Subject indicates time sensitivity

Respond as: CATEGORY|PRIORITY
Example: SUPPORT|URGENT
```

### Multi-Label Classification

For emails that fit multiple categories:

```
This email could be both a sales inquiry AND a support request.
Return all applicable categories separated by commas.
Example: SALES,SUPPORT
```

## Workflow JSON

```json
{
  "name": "Email Classification Router",
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
        "model": "gpt-3.5-turbo",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "Classify emails as: SUPPORT, SALES, GENERAL, or SPAM. Respond with only the category."
            },
            {
              "role": "user",
              "content": "From: {{ $json.from }}\nSubject: {{ $json.subject }}\n\n{{ $json.text }}"
            }
          ]
        }
      },
      "name": "Classify",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "rules": {
          "values": [
            { "outputKey": "support", "conditions": { "string": [{ "value1": "={{ $json.message.content }}", "value2": "SUPPORT" }] } },
            { "outputKey": "sales", "conditions": { "string": [{ "value1": "={{ $json.message.content }}", "value2": "SALES" }] } },
            { "outputKey": "general", "conditions": { "string": [{ "value1": "={{ $json.message.content }}", "value2": "GENERAL" }] } },
            { "outputKey": "spam", "conditions": { "string": [{ "value1": "={{ $json.message.content }}", "value2": "SPAM" }] } }
          ]
        }
      },
      "name": "Route",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 2,
      "position": [650, 300]
    }
  ],
  "connections": {
    "AgentMail Trigger": {
      "main": [[{ "node": "Classify", "type": "main", "index": 0 }]]
    },
    "Classify": {
      "main": [[{ "node": "Route", "type": "main", "index": 0 }]]
    }
  }
}
```

## Testing

Send test emails with different intents:

1. **Support test:**
   ```
   Subject: App not loading
   Body: I'm getting an error when I try to log in. Error code 500.
   ```

2. **Sales test:**
   ```
   Subject: Pricing question
   Body: How much does your enterprise plan cost?
   ```

3. **Spam test:**
   ```
   Subject: Special offer just for you!
   Body: Click here to claim your free prize...
   ```

## Troubleshooting

### Misclassification?

- Add more examples to the prompt
- Use GPT-4 for better accuracy
- Fine-tune with your specific email patterns

### Switch not routing correctly?

- Check for whitespace/newlines in AI output
- Use `.trim()` on the classification result
- Add a default/fallback route

## Related Examples

- [AI Auto-Reply](01-ai-auto-reply.md) - Respond to classified emails
- [Support Tickets](06-support-tickets.md) - Full support workflow
