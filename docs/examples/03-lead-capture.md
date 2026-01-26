# Example: Lead Capture to Google Sheets

Automatically extract contact information from incoming emails and save to Google Sheets for lead management.

## What You'll Build

```
AgentMail Trigger → OpenAI (Extract Info) → Google Sheets (Add Row)
```

This workflow:
- Captures emails from potential customers
- Extracts key information (name, company, interest, etc.)
- Logs leads to a Google Sheets spreadsheet
- Optionally sends a follow-up acknowledgment

## Prerequisites

- AgentMail API key
- OpenAI API key
- Google account with Sheets access
- n8n Google Sheets credentials configured

## Step-by-Step Setup

### Step 1: Create Your Lead Tracking Spreadsheet

Create a Google Sheet with these columns:

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| Date | Name | Email | Company | Interest | Message | Source |

### Step 2: Create the Workflow

#### Add AgentMail Trigger

1. Create workflow named "Lead Capture"
2. Add **AgentMail Trigger**
3. Set Event: **Email Received**

#### Add OpenAI Extraction Node

1. Add **OpenAI** node
2. Configure:

**System Message:**
```
You are a data extraction assistant. Extract lead information from emails and respond in this exact JSON format:

{
  "name": "extracted name or 'Unknown'",
  "company": "company name or 'Not specified'",
  "interest": "brief summary of what they're interested in",
  "urgency": "high/medium/low based on tone",
  "message_summary": "1-2 sentence summary of their message"
}

Only respond with valid JSON, no other text.
```

**User Message:**
```
Extract lead information from this email:

From: {{ $json.from }}
Subject: {{ $json.subject }}

{{ $json.text }}
```

#### Add Code Node (Parse JSON)

1. Add **Code** node to parse the AI response
2. JavaScript:

```javascript
const aiResponse = $json.message.content;
const extracted = JSON.parse(aiResponse);
const trigger = $('AgentMail Trigger').item.json;

return [{
  date: new Date().toISOString(),
  name: extracted.name,
  email: trigger.from,
  company: extracted.company,
  interest: extracted.interest,
  urgency: extracted.urgency,
  message_summary: extracted.message_summary,
  subject: trigger.subject,
  full_message: trigger.text
}];
```

#### Add Google Sheets Node

1. Add **Google Sheets** node
2. Configure:
   - **Operation**: Append Row
   - **Document**: Select your spreadsheet
   - **Sheet**: Sheet1
   - **Mapping**:
     - Date → `{{ $json.date }}`
     - Name → `{{ $json.name }}`
     - Email → `{{ $json.email }}`
     - Company → `{{ $json.company }}`
     - Interest → `{{ $json.interest }}`
     - Message → `{{ $json.message_summary }}`
     - Source → `AgentMail`

### Step 3: Add Optional Follow-up Email

Add another **AgentMail** node to send acknowledgment:

```
Resource: Message
Operation: Reply
Thread ID: {{ $('AgentMail Trigger').item.json.threadId }}
Text:
"Thank you for reaching out!

We've received your inquiry and a member of our team will get back to you within 24 hours.

In the meantime, feel free to check out our website for more information.

Best regards,
The Team"
```

## Enhanced Data Extraction

### Extract More Fields

Expand the extraction prompt:

```json
{
  "name": "full name",
  "first_name": "first name only",
  "last_name": "last name only",
  "email": "email if different from sender",
  "phone": "phone number if mentioned",
  "company": "company name",
  "company_size": "small/medium/large/enterprise if mentioned",
  "role": "job title if mentioned",
  "interest": "what product/service they're interested in",
  "budget": "budget if mentioned",
  "timeline": "when they want to proceed",
  "urgency": "high/medium/low",
  "source": "how they heard about us if mentioned",
  "questions": ["list", "of", "specific", "questions"],
  "sentiment": "positive/neutral/negative"
}
```

### Lead Scoring

Add a Code node to calculate a lead score:

```javascript
const lead = $json;
let score = 0;

// Company mentioned = +20
if (lead.company !== 'Not specified') score += 20;

// Budget mentioned = +30
if (lead.budget) score += 30;

// Timeline mentioned = +20
if (lead.timeline) score += 20;

// High urgency = +20
if (lead.urgency === 'high') score += 20;

// Enterprise company = +10
if (lead.company_size === 'enterprise') score += 10;

return [{
  ...lead,
  score,
  tier: score >= 70 ? 'Hot' : score >= 40 ? 'Warm' : 'Cold'
}];
```

### Duplicate Detection

Before adding to sheets, check for existing leads:

```javascript
// Use Google Sheets "Get All Rows" first
const existingLeads = $('Get Existing').item.json;
const newEmail = $json.email.toLowerCase();

const isDuplicate = existingLeads.some(
  row => row.Email.toLowerCase() === newEmail
);

return [{
  ...$json,
  isDuplicate,
  action: isDuplicate ? 'update' : 'create'
}];
```

## Workflow JSON

```json
{
  "name": "Lead Capture to Google Sheets",
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
              "content": "Extract lead info as JSON: {name, company, interest, urgency, message_summary}"
            },
            {
              "role": "user",
              "content": "From: {{ $json.from }}\nSubject: {{ $json.subject }}\n\n{{ $json.text }}"
            }
          ]
        }
      },
      "name": "Extract Info",
      "type": "n8n-nodes-base.openAi",
      "typeVersion": 1,
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "const data = JSON.parse($json.message.content);\nconst trigger = $('AgentMail Trigger').item.json;\nreturn [{ date: new Date().toISOString(), ...data, email: trigger.from }];"
      },
      "name": "Parse",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "operation": "append",
        "documentId": "YOUR_SHEET_ID",
        "sheetName": "Sheet1",
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "Date": "={{ $json.date }}",
            "Name": "={{ $json.name }}",
            "Email": "={{ $json.email }}",
            "Company": "={{ $json.company }}",
            "Interest": "={{ $json.interest }}"
          }
        }
      },
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [850, 300]
    }
  ],
  "connections": {
    "AgentMail Trigger": {
      "main": [[{ "node": "Extract Info", "type": "main", "index": 0 }]]
    },
    "Extract Info": {
      "main": [[{ "node": "Parse", "type": "main", "index": 0 }]]
    },
    "Parse": {
      "main": [[{ "node": "Google Sheets", "type": "main", "index": 0 }]]
    }
  }
}
```

## Integration Alternatives

Instead of Google Sheets, send leads to:

### Airtable
```
Airtable Node → Create Record
Base: Leads
Table: Contacts
Fields: map extracted data
```

### HubSpot
```
HubSpot Node → Create Contact
Properties: email, firstname, company, etc.
```

### Notion
```
Notion Node → Create Database Item
Database: Leads
Properties: map to Notion fields
```

## Testing

Send a test email:
```
To: your-inbox@agentmail.to
Subject: Interested in your product

Hi,

I'm John Smith from Acme Corp. We're looking for a solution
to manage our customer emails and I think your product might help.

Could you tell me more about pricing for a team of 50 people?
We'd like to get started within the next month.

Thanks,
John
```

Expected extracted data:
```json
{
  "name": "John Smith",
  "company": "Acme Corp",
  "interest": "Email management solution for customer emails",
  "urgency": "medium",
  "message_summary": "Interested in pricing for 50-person team, wants to start within a month"
}
```

## Troubleshooting

### JSON parsing errors?

- Add error handling in the Code node
- Use try/catch to handle malformed AI responses
- Add a fallback for unparseable responses

### Missing data in sheets?

- Check column name mappings
- Verify Google Sheets permissions
- Ensure the sheet has the expected columns

## Related Examples

- [Email Classification](02-email-classification.md) - Route leads by type
- [Slack Notifications](04-slack-notifications.md) - Alert team of hot leads
