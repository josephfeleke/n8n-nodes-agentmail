import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	IDataObject,
	IHttpRequestMethods,
} from 'n8n-workflow';

export class AgentMailTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AgentMail Trigger',
		name: 'agentMailTrigger',
		icon: 'file:agentmail.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '=Listens for {{$parameter["event"]}}',
		description: 'Triggers when an email event occurs (received, sent, etc.)',
		defaults: {
			name: 'AgentMail Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'agentMailApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Email Received',
						value: 'message.received',
						description: 'Triggers when an email is received in any inbox',
					},
					{
						name: 'Email Sent',
						value: 'message.sent',
						description: 'Triggers when an email is sent',
					},
					{
						name: 'Email Delivered',
						value: 'message.delivered',
						description: 'Triggers when an email is delivered',
					},
					{
						name: 'Email Bounced',
						value: 'message.bounced',
						description: 'Triggers when an email bounces',
					},
				],
				default: 'message.received',
				required: true,
				description: 'The event to listen for',
			},
			{
				displayName: 'Inbox Filter',
				name: 'inboxFilter',
				type: 'string',
				default: '',
				placeholder: 'inbox_abc123',
				description: 'Only trigger for this specific inbox ID (leave empty for all inboxes)',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const webhookData = this.getWorkflowStaticData('node');
				const baseUrl = 'https://api.agentmail.to/v0';

				// Check if we have a stored webhook ID
				if (webhookData.webhookId) {
					try {
						// Verify it still exists
						await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/webhooks/${webhookData.webhookId}`,
								json: true,
							},
						);
						return true;
					} catch (error) {
						// Webhook no longer exists
						delete webhookData.webhookId;
						return false;
					}
				}

				// Check if any webhook matches our URL
				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'agentMailApi',
						{
							method: 'GET' as IHttpRequestMethods,
							url: `${baseUrl}/webhooks`,
							json: true,
						},
					) as IDataObject;

					const webhooks = (response.webhooks || response.data || []) as IDataObject[];
					for (const webhook of webhooks) {
						if (webhook.url === webhookUrl) {
							webhookData.webhookId = webhook.webhook_id || webhook.id;
							return true;
						}
					}
				} catch (error) {
					// Ignore errors
				}

				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const event = this.getNodeParameter('event') as string;
				const webhookData = this.getWorkflowStaticData('node');
				const baseUrl = 'https://api.agentmail.to/v0';

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'agentMailApi',
						{
							method: 'POST' as IHttpRequestMethods,
							url: `${baseUrl}/webhooks`,
							body: {
								url: webhookUrl,
								event_types: [event],
							},
							json: true,
						},
					) as IDataObject;

					webhookData.webhookId = response.webhook_id || response.id || (response.webhook as IDataObject)?.id;
					return true;
				} catch (error) {
					return false;
				}
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const baseUrl = 'https://api.agentmail.to/v0';

				if (!webhookData.webhookId) {
					return true;
				}

				try {
					await this.helpers.httpRequestWithAuthentication.call(
						this,
						'agentMailApi',
						{
							method: 'DELETE' as IHttpRequestMethods,
							url: `${baseUrl}/webhooks/${webhookData.webhookId}`,
							json: true,
						},
					);
				} catch (error) {
					// Ignore errors on delete
				}

				delete webhookData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const body = this.getBodyData() as IDataObject;
		const event = this.getNodeParameter('event') as string;
		const inboxFilter = this.getNodeParameter('inboxFilter') as string;

		// Verify event type matches
		const eventType = body.type || body.event;
		if (eventType !== event) {
			// Return 200 but don't trigger workflow
			return {
				noWebhookResponse: true,
			};
		}

		// Filter by inbox if specified
		if (inboxFilter) {
			const messageData = (body.data || body.message || body) as IDataObject;
			const inboxId = messageData.inbox_id || messageData.inboxId;
			if (inboxId !== inboxFilter) {
				return {
					noWebhookResponse: true,
				};
			}
		}

		// Extract message data for easier access
		const messageData = (body.data || body.message || {}) as IDataObject;
		
		// Return formatted data
		return {
			workflowData: [
				this.helpers.returnJsonArray({
					event: eventType,
					eventId: body.event_id || body.eventId,
					timestamp: body.timestamp,
					// Message details
					messageId: messageData.message_id || messageData.id,
					inboxId: messageData.inbox_id || messageData.inboxId,
					threadId: messageData.thread_id || messageData.threadId,
					from: messageData.from,
					to: messageData.to,
					subject: messageData.subject,
					text: messageData.text || messageData.body,
					html: messageData.html,
					// Labels and metadata
					labels: messageData.labels,
					attachments: messageData.attachments,
					// Raw payload for advanced use
					rawPayload: body,
				}),
			],
		};
	}
}
