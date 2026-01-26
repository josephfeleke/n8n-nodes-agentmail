# Smart Inbox Filter

Use AgentMail as your primary inbox with AI-powered email triage. Important emails are forwarded immediately to your personal email, while promotional emails are accumulated and sent as a digest every 5 hours.

## Overview

This workflow creates an intelligent email filtering system:
- **Important emails** (personal, financial, security alerts) → Forwarded immediately
- **Promotional emails** (marketing, newsletters, offers) → Stored and summarized every 5 hours

## Architecture

```
PATH 1: Real-time Email Processing
┌─────────────────┐    ┌─────────────┐    ┌─────────────┐
│ AgentMail       │───▶│ OpenAI      │───▶│ Switch      │
│ Trigger         │    │ (Classify)  │    │ (Route)     │
└─────────────────┘    └─────────────┘    └──────┬──────┘
                                              ┌──┴──┐
                                              │     │
                                              ▼     ▼
                                    ┌───────────┐ ┌───────────┐
                                    │ AgentMail │ │ Google    │
                                    │ (Forward) │ │ Sheets    │
                                    └───────────┘ └───────────┘
                                      IMPORTANT     PROMO

PATH 2: Scheduled Promo Digest (every 5 hours)
┌─────────────────┐    ┌─────────────┐    ┌─────────────┐
│ Schedule        │───▶│ Google      │───▶│ IF          │
│ Trigger         │    │ Sheets      │    │ (Has Data?) │
└─────────────────┘    └─────────────┘    └──────┬──────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────┐
                                    │ Aggregate → OpenAI  │
                                    │ → Send → Clear      │
                                    └─────────────────────┘
```

## Prerequisites

- AgentMail API key ([sign up](https://agentmail.to))
- OpenAI API key
- Google account (for Google Sheets)
- Personal email address (for forwarding)

## Setup Instructions

### Step 1: Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Create a new spreadsheet named "Smart Inbox Filter - Promos"
3. Add these headers in row 1:

| A | B | C | D |
|---|---|---|---|
| received_at | from | subject | preview |

4. Copy the spreadsheet URL for use in the workflow

### Step 2: Import the Workflow

1. Download the [workflow JSON](../../examples/smart-inbox-filter.json)
2. In n8n, go to **Workflows → Import from File**
3. Select the downloaded JSON file

### Step 3: Configure Credentials

1. **AgentMail**: Add your AgentMail API credentials
2. **OpenAI**: Add your OpenAI API credentials
3. **Google Sheets**: Connect your Google account

### Step 4: Update Placeholder Values

Replace these placeholders in the workflow:

| Node | Field | Replace With |
|------|-------|--------------|
| Forward Important | To | Your personal email |
| Store Promo | Document ID | Your Google Sheet URL |
| Send Digest | Inbox ID | Your AgentMail inbox ID |
| Send Digest | To | Your personal email |
| Read Promos | Document ID | Your Google Sheet URL |
| Clear Promos | Document ID | Your Google Sheet URL |

### Step 5: Activate

1. Click **Publish** to save the workflow
2. Toggle the workflow to **Active**

## How It Works

### Email Classification

The AI classifier uses these criteria:

**IMPORTANT (Forward immediately):**
- Personal correspondence (friends, family, colleagues)
- Financial notifications (banks, payments, invoices)
- Account security alerts
- Replies to conversations
- Time-sensitive matters (appointments, deadlines)
- Work/business communications
- Service confirmations (orders, bookings)

**PROMO (Accumulate for digest):**
- Marketing and promotional emails
- Newsletters and subscriptions
- Sales offers and discounts
- Product announcements
- Automated marketing sequences
- Emails with "unsubscribe" footers
- Mass-mailing characteristics

### Digest Format

The AI-generated digest is organized into sections:

```
## Promo Email Digest

### Worth Checking
- [Valuable deals and time-sensitive offers]

### Standard Promotions
- [Typical marketing emails]

### Skip These
- [Low-value or spam-like content]
```

## Customization

### Change Digest Frequency

Edit the Schedule Trigger node:
- Default: Every 5 hours
- Options: Minutes, hours, days, weeks, or specific times

### Modify Classification Rules

Edit the "Classify Email" OpenAI node's system prompt to adjust what counts as important vs. promotional.

### Add More Categories

Extend the Switch node to route emails to additional destinations:
- Urgent → SMS notification
- Support requests → Ticketing system
- Newsletters → Separate folder

## Troubleshooting

### Emails not being classified correctly

- Check that the OpenAI node is receiving the email content
- Verify the system prompt includes your specific classification needs
- Test with the "Execute step" button to see the classification output

### Google Sheets not connecting

- Ensure your Google account is properly authorized in n8n
- Verify the spreadsheet URL is correct and accessible
- Check that the sheet name matches exactly (case-sensitive)

### Digest not sending

- Verify the Schedule Trigger is active
- Check that there are rows in the Google Sheet
- Ensure the AgentMail credentials are valid

## Related Examples

- [AI Auto-Reply](01-ai-auto-reply.md) - Automatically respond to emails
- [Email Classification](02-email-classification.md) - Route emails by category
- [Daily Summary](05-daily-summary.md) - AI-generated email digests
