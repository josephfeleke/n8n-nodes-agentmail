import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	IDataObject,
	IHttpRequestMethods,
} from 'n8n-workflow';

export class AgentMail implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AgentMail',
		name: 'agentMail',
		icon: 'file:agentmail.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Email API for AI Agents - Create inboxes, send/receive emails, and more',
		defaults: {
			name: 'AgentMail',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'agentMailApi',
				required: true,
			},
		],
		properties: [
			// ----------------------------------
			//         Resource Selection
			// ----------------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Inbox',
						value: 'inbox',
						description: 'Manage email inboxes for your AI agents',
					},
					{
						name: 'Message',
						value: 'message',
						description: 'Send, receive, and manage emails',
					},
					{
						name: 'Thread',
						value: 'thread',
						description: 'Manage email threads/conversations',
					},
					{
						name: 'Webhook',
						value: 'webhook',
						description: 'Manage webhooks for real-time events',
					},
				],
				default: 'inbox',
			},

			// ----------------------------------
			//         Inbox Operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['inbox'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new inbox for an AI agent',
						action: 'Create an inbox',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete an inbox',
						action: 'Delete an inbox',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get an inbox by ID',
						action: 'Get an inbox',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all inboxes',
						action: 'List inboxes',
					},
				],
				default: 'create',
			},

			// Inbox: Create
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				placeholder: 'my-agent',
				description: 'Username for the inbox email address (e.g., my-agent@agentmail.to)',
				displayOptions: {
					show: {
						resource: ['inbox'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Display Name',
				name: 'displayName',
				type: 'string',
				default: '',
				placeholder: 'My AI Agent',
				description: 'Display name for the inbox',
				displayOptions: {
					show: {
						resource: ['inbox'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'string',
				default: 'agentmail.to',
				description: 'Domain for the inbox (default: agentmail.to)',
				displayOptions: {
					show: {
						resource: ['inbox'],
						operation: ['create'],
					},
				},
			},

			// Inbox: Get/Delete
			{
				displayName: 'Inbox ID',
				name: 'inboxId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the inbox',
				displayOptions: {
					show: {
						resource: ['inbox'],
						operation: ['get', 'delete'],
					},
				},
			},

			// ----------------------------------
			//         Message Operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send an email from an inbox',
						action: 'Send an email',
					},
					{
						name: 'Reply',
						value: 'reply',
						description: 'Reply to an existing message',
						action: 'Reply to a message',
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get a message by ID',
						action: 'Get a message',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List messages in an inbox',
						action: 'List messages',
					},
				],
				default: 'send',
			},

			// Message: Send
			{
				displayName: 'Inbox ID',
				name: 'inboxId',
				type: 'string',
				default: '',
				required: true,
				description: 'The inbox to send from',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'list'],
					},
				},
			},
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'recipient@example.com',
				description: 'Recipient email address',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'Hello from my AI agent',
				description: 'Email subject line',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send'],
					},
				},
			},
			{
				displayName: 'Body (Text)',
				name: 'textBody',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				description: 'Plain text body of the email',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'reply'],
					},
				},
			},
			{
				displayName: 'Body (HTML)',
				name: 'htmlBody',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				description: 'HTML body of the email (optional)',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'reply'],
					},
				},
			},

			// Message: Reply
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				required: true,
				description: 'The ID of the message to reply to or get',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['reply', 'get'],
					},
				},
			},

			// Message: List options
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 20,
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['message', 'inbox', 'thread'],
						operation: ['list'],
					},
				},
			},

			// ----------------------------------
			//         Thread Operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['thread'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a thread by ID',
						action: 'Get a thread',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List threads in an inbox',
						action: 'List threads',
					},
				],
				default: 'list',
			},
			{
				displayName: 'Inbox ID',
				name: 'inboxId',
				type: 'string',
				default: '',
				required: true,
				description: 'The inbox ID',
				displayOptions: {
					show: {
						resource: ['thread'],
						operation: ['list'],
					},
				},
			},
			{
				displayName: 'Thread ID',
				name: 'threadId',
				type: 'string',
				default: '',
				required: true,
				description: 'The thread ID',
				displayOptions: {
					show: {
						resource: ['thread'],
						operation: ['get'],
					},
				},
			},

			// ----------------------------------
			//         Webhook Operations
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webhook'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new webhook',
						action: 'Create a webhook',
					},
					{
						name: 'Delete',
						value: 'delete',
						description: 'Delete a webhook',
						action: 'Delete a webhook',
					},
					{
						name: 'List',
						value: 'list',
						description: 'List all webhooks',
						action: 'List webhooks',
					},
				],
				default: 'create',
			},
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'https://your-server.com/webhook',
				description: 'URL to receive webhook events',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: [
					{ name: 'Message Received', value: 'message.received' },
					{ name: 'Message Sent', value: 'message.sent' },
					{ name: 'Message Delivered', value: 'message.delivered' },
					{ name: 'Message Bounced', value: 'message.bounced' },
				],
				default: ['message.received'],
				description: 'Events to subscribe to',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Webhook ID',
				name: 'webhookId',
				type: 'string',
				default: '',
				required: true,
				description: 'The webhook ID to delete',
				displayOptions: {
					show: {
						resource: ['webhook'],
						operation: ['delete'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const baseUrl = 'https://api.agentmail.to/v0';

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject;

				// ----------------------------------
				//         Inbox
				// ----------------------------------
				if (resource === 'inbox') {
					if (operation === 'create') {
						const username = this.getNodeParameter('username', i) as string;
						const displayName = this.getNodeParameter('displayName', i) as string;
						const domain = this.getNodeParameter('domain', i) as string;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'POST' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes`,
								body: {
									username,
									display_name: displayName || undefined,
									domain: domain || undefined,
								},
								json: true,
							},
						);
					} else if (operation === 'get') {
						const inboxId = this.getNodeParameter('inboxId', i) as string;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes/${inboxId}`,
								json: true,
							},
						);
					} else if (operation === 'list') {
						const limit = this.getNodeParameter('limit', i) as number;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes`,
								qs: { limit },
								json: true,
							},
						);
					} else if (operation === 'delete') {
						const inboxId = this.getNodeParameter('inboxId', i) as string;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'DELETE' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes/${inboxId}`,
								json: true,
							},
						);
					}
				}

				// ----------------------------------
				//         Message
				// ----------------------------------
				else if (resource === 'message') {
					if (operation === 'send') {
						const inboxId = this.getNodeParameter('inboxId', i) as string;
						const to = this.getNodeParameter('to', i) as string;
						const subject = this.getNodeParameter('subject', i) as string;
						const textBody = this.getNodeParameter('textBody', i) as string;
						const htmlBody = this.getNodeParameter('htmlBody', i) as string;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'POST' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes/${inboxId}/messages`,
								body: {
									to: [to],
									subject,
									text: textBody,
									html: htmlBody || undefined,
								},
								json: true,
							},
						);
					} else if (operation === 'reply') {
						const messageId = this.getNodeParameter('messageId', i) as string;
						const textBody = this.getNodeParameter('textBody', i) as string;
						const htmlBody = this.getNodeParameter('htmlBody', i) as string;

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'POST' as IHttpRequestMethods,
								url: `${baseUrl}/messages/${messageId}/reply`,
								body: {
									text: textBody,
									html: htmlBody || undefined,
								},
								json: true,
							},
						);
					} else if (operation === 'get') {
						const messageId = this.getNodeParameter('messageId', i) as string;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/messages/${messageId}`,
								json: true,
							},
						);
					} else if (operation === 'list') {
						const inboxId = this.getNodeParameter('inboxId', i) as string;
						const limit = this.getNodeParameter('limit', i) as number;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes/${inboxId}/messages`,
								qs: { limit },
								json: true,
							},
						);
					}
				}

				// ----------------------------------
				//         Thread
				// ----------------------------------
				else if (resource === 'thread') {
					if (operation === 'get') {
						const threadId = this.getNodeParameter('threadId', i) as string;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/threads/${threadId}`,
								json: true,
							},
						);
					} else if (operation === 'list') {
						const inboxId = this.getNodeParameter('inboxId', i) as string;
						const limit = this.getNodeParameter('limit', i) as number;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes/${inboxId}/threads`,
								qs: { limit },
								json: true,
							},
						);
					}
				}

				// ----------------------------------
				//         Webhook
				// ----------------------------------
				else if (resource === 'webhook') {
					if (operation === 'create') {
						const webhookUrl = this.getNodeParameter('webhookUrl', i) as string;
						const events = this.getNodeParameter('events', i) as string[];

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'POST' as IHttpRequestMethods,
								url: `${baseUrl}/webhooks`,
								body: {
									url: webhookUrl,
									events,
								},
								json: true,
							},
						);
					} else if (operation === 'list') {
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/webhooks`,
								json: true,
							},
						);
					} else if (operation === 'delete') {
						const webhookId = this.getNodeParameter('webhookId', i) as string;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'DELETE' as IHttpRequestMethods,
								url: `${baseUrl}/webhooks/${webhookId}`,
								json: true,
							},
						);
					}
				}

				// Add result to return data
				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData!),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
