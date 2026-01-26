# Example: Support Ticket Creation

Automatically create support tickets from incoming emails and send confirmation to customers.

## What You'll Build

```
AgentMail Trigger → OpenAI (Extract & Prioritize) → HTTP (Create Ticket) → AgentMail (Send Confirmation)
```

This workflow:
- Receives support requests via email
- Extracts issue details and assigns priority
- Creates a ticket in your ticketing system
- Sends an automatic acknowledgment with ticket number

## Prerequisites

- AgentMail API key
- OpenAI API key
- A ticketing system with API access (or use the mock example below)

## Step-by-Step Setup

### Step 1: Create the Support Workflow

#### Add AgentMail Trigger

1. Create workflow named "Support Ticket System"
2. Add **AgentMail Trigger**
3. Set Event: **Email Received**

#### Add OpenAI Extraction Node

1. Add **OpenAI** node
2. Configure:

**System Message:**
```
You are a support ticket analyzer. Extract information from support emails and respond with this exact JSON format:

{
  "title": "Brief issue title (max 60 chars)",
  "category": "one of: billing, technical, account, general",
  "priority": "one of: critical, high, medium, low",
  "description": "Clear description of the issue",
  "steps_to_reproduce": "If technical issue, list steps or null",
  "customer_sentiment": "frustrated, neutral, or positive",
  "requires_escalation": true or false
}

Priority guidelines:
- critical: Service down, security issue, data loss
- high: Major feature broken, blocking issue
- medium: Feature not working as expected
- low: Questions, minor issues, feature requests

Only respond with valid JSON.
```

**User Message:**
```
Analyze this support request:

From: {{ $json.from }}
Subject: {{ $json.subject }}

{{ $json.text }}
```

#### Add Code Node (Parse & Enrich)

1. Add **Code** node
2. JavaScript:

```javascript
const trigger = $('AgentMail Trigger').item.json;
const aiResponse = JSON.parse($json.message.content);

// Generate ticket number
const ticketNumber = 'TKT-' + Date.now().toString(36).toUpperCase();

return [{
  ticketNumber,
  ...aiResponse,
  customer: {
    email: trigger.from,
    subject: trigger.subject,
    originalMessage: trigger.text,
    threadId: trigger.threadId,
    messageId: trigger.messageId
  },
  metadata: {
    createdAt: new Date().toISOString(),
    source: 'email',
    inboxId: trigger.inboxId
  }
}];
```

#### Add HTTP Request Node (Create Ticket)

For this example, we'll use a generic HTTP request. Replace with your actual ticketing system.

**Option A: Generic Webhook/API**

```json
{
  "method": "POST",
  "url": "https://your-ticketing-system.com/api/tickets",
  "headers": {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
  },
  "body": {
    "external_id": "{{ $json.ticketNumber }}",
    "title": "{{ $json.title }}",
    "description": "{{ $json.description }}",
    "priority": "{{ $json.priority }}",
    "category": "{{ $json.category }}",
    "customer_email": "{{ $json.customer.email }}",
    "tags": ["email", "auto-created"]
  }
}
```

**Option B: Mock Endpoint for Testing**

Use n8n's built-in Respond to Webhook or a service like webhook.site for testing.

#### Add AgentMail Confirmation Node

1. Add **AgentMail** node
2. Configure:
   - **Resource**: Message
   - **Operation**: Reply
   - **Thread ID**: `{{ $json.customer.threadId }}`
   - **Text**:

```
Hi,

Thank you for contacting support. We've received your request and created a ticket.

📋 **Ticket Details**
- Ticket Number: {{ $json.ticketNumber }}
- Category: {{ $json.category }}
- Priority: {{ $json.priority }}

**What happens next?**
Our support team will review your request and respond within:
- Critical/High: 4 hours
- Medium: 24 hours
- Low: 48 hours

You can reply to this email to add more information to your ticket.

Best regards,
Support Team

---
Reference: {{ $json.ticketNumber }}
```

### Step 2: Add Error Handling

#### Add Error Trigger Node

1. Add **Error Trigger** node
2. Connect to a notification flow (Slack, email to support team)

```javascript
// In error handler
return [{
  error: $json.error.message,
  originalEmail: $('AgentMail Trigger').item.json,
  timestamp: new Date().toISOString()
}];
```

### Step 3: Integrate with Popular Ticketing Systems

#### Zendesk Integration

```json
{
  "method": "POST",
  "url": "https://YOUR_DOMAIN.zendesk.com/api/v2/tickets",
  "headers": {
    "Authorization": "Basic BASE64_ENCODED_CREDENTIALS"
  },
  "body": {
    "ticket": {
      "subject": "{{ $json.title }}",
      "description": "{{ $json.description }}",
      "priority": "{{ $json.priority }}",
      "requester": {
        "email": "{{ $json.customer.email }}"
      }
    }
  }
}
```

#### Freshdesk Integration

```json
{
  "method": "POST",
  "url": "https://YOUR_DOMAIN.freshdesk.com/api/v2/tickets",
  "headers": {
    "Authorization": "Basic BASE64_API_KEY"
  },
  "body": {
    "subject": "{{ $json.title }}",
    "description": "{{ $json.description }}",
    "email": "{{ $json.customer.email }}",
    "priority": {{ $json.priority === 'critical' ? 4 : $json.priority === 'high' ? 3 : $json.priority === 'medium' ? 2 : 1 }},
    "status": 2
  }
}
```

#### Linear Integration

```json
{
  "method": "POST",
  "url": "https://api.linear.app/graphql",
  "headers": {
    "Authorization": "Bearer YOUR_LINEAR_API_KEY"
  },
  "body": {
    "query": "mutation { issueCreate(input: { title: \"{{ $json.title }}\", description: \"{{ $json.description }}\", teamId: \"YOUR_TEAM_ID\" }) { success issue { id identifier } } }"
  }
}
```

## Enhanced Features

### Auto-Escalation

Add escalation for critical issues:

```javascript
if ($json.priority === 'critical' || $json.requires_escalation) {
  // Send to Slack #urgent-support
  // Page on-call engineer
  // Create high-priority alert
}
```

### SLA Tracking

Calculate and track response deadlines:

```javascript
const slaHours = {
  critical: 1,
  high: 4,
  medium: 24,
  low: 48
};

const deadline = new Date(
  Date.now() + slaHours[$json.priority] * 60 * 60 * 1000
);

return [{
  ...$json,
  sla: {
    deadline: deadline.toISOString(),
    hoursToRespond: slaHours[$json.priority]
  }
}];
```

### Duplicate Detection

Check for existing tickets from same customer:

```javascript
// First, fetch recent tickets for this customer
const recentTickets = await getRecentTickets($json.customer.email);

const potentialDuplicate = recentTickets.find(ticket =>
  similarity(ticket.title, $json.title) > 0.8 &&
  ticket.status !== 'closed'
);

if (potentialDuplicate) {
  // Update existing ticket instead of creating new one
  return [{
    action: 'update',
    existingTicketId: potentialDuplicate.id,
    newMessage: $json.description
  }];
}
```

## Workflow JSON

```json
{
  "name": "Support Ticket System",
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
              "content": "Extract support ticket info as JSON: {title, category, priority, description}"
            },
            {
              "role": "user",
              "content": "From: {{ $json.from }}\nSubject: {{ $json.subject }}\n\n{{ $json.text }}"
            }
          ]
        }
      },
      "name": "Analyze",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "const trigger = $('AgentMail Trigger').item.json;\nconst data = JSON.parse($json.message.content);\nconst ticketNumber = 'TKT-' + Date.now().toString(36).toUpperCase();\nreturn [{ ticketNumber, ...data, customer: { email: trigger.from, threadId: trigger.threadId } }];"
      },
      "name": "Prepare",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://your-api.com/tickets",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            { "name": "ticket_id", "value": "={{ $json.ticketNumber }}" },
            { "name": "title", "value": "={{ $json.title }}" },
            { "name": "priority", "value": "={{ $json.priority }}" }
          ]
        }
      },
      "name": "Create Ticket",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [850, 300]
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "reply",
        "threadId": "={{ $('Prepare').item.json.customer.threadId }}",
        "text": "Thank you! Your ticket {{ $('Prepare').item.json.ticketNumber }} has been created."
      },
      "name": "Send Confirmation",
      "type": "n8n-nodes-agentmail.agentMail",
      "typeVersion": 1,
      "position": [1050, 300]
    }
  ],
  "connections": {
    "AgentMail Trigger": {
      "main": [[{ "node": "Analyze", "type": "main", "index": 0 }]]
    },
    "Analyze": {
      "main": [[{ "node": "Prepare", "type": "main", "index": 0 }]]
    },
    "Prepare": {
      "main": [[{ "node": "Create Ticket", "type": "main", "index": 0 }]]
    },
    "Create Ticket": {
      "main": [[{ "node": "Send Confirmation", "type": "main", "index": 0 }]]
    }
  }
}
```

## Testing

Send a test support email:

```
To: support@agentmail.to
Subject: Cannot log in to my account

Hi,

I've been trying to log in to my account for the past hour but keep getting
an "Invalid credentials" error. I'm sure my password is correct.

This is urgent as I have a deadline today and need to access my files.

My username is john@example.com

Please help!

John
```

Expected ticket:
```json
{
  "ticketNumber": "TKT-ABC123",
  "title": "Login issue - Invalid credentials error",
  "category": "technical",
  "priority": "high",
  "description": "User unable to log in, receiving 'Invalid credentials' error despite correct password",
  "customer_sentiment": "frustrated",
  "requires_escalation": false
}
```

## Troubleshooting

### Ticket not being created?

- Check HTTP request logs for API errors
- Verify API credentials
- Test API endpoint directly

### Confirmation not sending?

- Verify Thread ID is passed correctly
- Check AgentMail credentials
- Review execution logs

### Wrong priority assigned?

- Add more examples to the AI prompt
- Fine-tune priority guidelines
- Consider rule-based override for keywords

## Related Examples

- [Email Classification](02-email-classification.md) - Pre-filter emails
- [AI Auto-Reply](01-ai-auto-reply.md) - Quick responses
- [Slack Notifications](04-slack-notifications.md) - Alert team
