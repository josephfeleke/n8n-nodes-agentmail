import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	NodeConnectionTypes,
	IDataObject,
	IHttpRequestMethods,
} from 'n8n-workflow';
import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

export class AgentMailTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AgentMail Trigger',
		name: 'agentMailTrigger',
		icon: 'file:agentmail.svg',
		iconColor: 'black',
		group: ['trigger'],
		version: 1,
		subtitle: '=Listens for {{$parameter["event"]}}',
		description: 'Triggers when an email event occurs (received, sent, etc.)',
		defaults: {
			name: 'AgentMail Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
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
		triggerPanel: {
			header: 'Listen for AgentMail Events',
			executionsHelp: {
				inactive: 'Activate the workflow to start listening for emails. AgentMail will send events to this node whenever an email is received, sent, delivered, or bounced.',
				active: 'Your workflow is listening for emails. Send an email to one of your AgentMail inboxes to trigger it.',
			},
			activationHint: 'Activate the workflow to start receiving emails in real time.',
		},
		activationMessage: 'Your workflow is now listening for AgentMail email events.',
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'Email Bounced',
						value: 'message.bounced',
						description: 'Triggers when an email bounces',
					},
					{
						name: 'Email Delivered',
						value: 'message.delivered',
						description: 'Triggers when an email is delivered',
					},
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
				],
				default: 'message.received',
				required: true,
				description: 'The event to listen for',
			},
			{
				displayName: 'Inbox Filter Name or ID',
				name: 'inboxFilter',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getInboxes',
				},
				default: '',
				description: 'Only trigger for this specific inbox (leave empty for all inboxes). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
		],
	};

	methods = {
		loadOptions: {
			async getInboxes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'agentMailApi',
					{
						method: 'GET' as IHttpRequestMethods,
						url: 'https://api.agentmail.to/v0/inboxes',
						qs: { limit: 100 },
						json: true,
					},
				) as IDataObject;

				const inboxes = (response.inboxes || []) as IDataObject[];
				const options: INodePropertyOptions[] = [
					{ name: 'All Inboxes', value: '' },
				];
				for (const inbox of inboxes) {
					options.push({
						name: (inbox.email as string) || `${inbox.username}@${inbox.domain || 'agentmail.to'}`,
						value: (inbox.inbox_id || inbox.id) as string,
					});
				}
				return options;
			},
		},
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
					} catch {
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
				} catch {
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
				} catch {
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
				} catch {
					// Ignore errors on delete
				}

				delete webhookData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
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
