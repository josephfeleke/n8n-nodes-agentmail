import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionTypes,
	IDataObject,
	IHttpRequestMethods,
} from 'n8n-workflow';
import type { ILoadOptionsFunctions, INodePropertyOptions, JsonObject } from 'n8n-workflow';

export class AgentMail implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AgentMail',
		name: 'agentMail',
		icon: 'file:agentmail.svg',
		iconColor: 'black',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Email API for AI Agents - Create inboxes, send/receive emails, and more',
		defaults: {
			name: 'AgentMail',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'agentMailApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'To get started, create an API key at <a href="https://agentmail.to/dashboard" target="_blank">agentmail.to/dashboard</a>',
				name: 'apiKeyNotice',
				type: 'notice',
				default: '',
			},

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
				required: true,
				placeholder: 'my-agent',
				hint: 'This becomes the email address: username@agentmail.to',
				description: 'Username for the inbox email address (e.g., my-agent@agentmail.to)',
				displayOptions: {
					show: {
						resource: ['inbox'],
						operation: ['create'],
					},
				},
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['inbox'],
						operation: ['create'],
					},
				},
				options: [
					{
						displayName: 'Display Name',
						name: 'displayName',
						type: 'string',
						default: '',
						placeholder: 'My AI Agent',
						description: 'A friendly name shown in email headers (e.g., "My AI Agent")',
					},
					{
						displayName: 'Domain',
						name: 'domain',
						type: 'string',
						default: '',
						placeholder: 'agentmail.to',
						description: 'Custom domain for the inbox. Leave empty to use agentmail.to.',
					},
				],
			},

			// Inbox: Get/Delete
			{
				displayName: 'Inbox Name or ID',
				name: 'inboxId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getInboxes',
				},
				default: '',
				required: true,
				description: 'The inbox to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
					{
						name: 'Reply',
						value: 'reply',
						description: 'Reply to an existing message',
						action: 'Reply to a message',
					},
					{
						name: 'Send',
						value: 'send',
						description: 'Send an email from an inbox',
						action: 'Send an email',
					},
				],
				default: 'get',
			},

			// Message: All operations need inbox
			{
				displayName: 'Inbox Name or ID',
				name: 'inboxId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getInboxes',
				},
				default: '',
				required: true,
				description: 'The inbox to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'list', 'reply', 'get'],
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
				displayName: 'Message',
				name: 'textBody',
				type: 'string',
				typeOptions: {
					rows: 5,
				},
				default: '',
				required: true,
				description: 'The message body of the email',
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'reply'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'messageOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['message'],
						operation: ['send', 'reply'],
					},
				},
				options: [
					{
						displayName: 'HTML Body',
						name: 'htmlBody',
						type: 'string',
						typeOptions: {
							editor: 'htmlEditor',
						},
						default: '',
						description: 'Send as HTML email instead of plain text. Overrides the message body for email clients that support HTML.',
					},
				],
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

			// List options
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						operation: ['list'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
				},
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						operation: ['list'],
						returnAll: [false],
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
				displayName: 'Inbox Name or ID',
				name: 'inboxId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getInboxes',
				},
				default: '',
				required: true,
				description: 'The inbox to use. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
					{ name: 'Message Bounced', value: 'message.bounced' },
					{ name: 'Message Delivered', value: 'message.delivered' },
					{ name: 'Message Received', value: 'message.received' },
					{ name: 'Message Sent', value: 'message.sent' },
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
				return inboxes.map((inbox) => ({
					name: (inbox.email as string) || `${inbox.username}@${inbox.domain || 'agentmail.to'}`,
					value: (inbox.inbox_id || inbox.id) as string,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		const baseUrl = 'https://api.agentmail.to/v0';

		const listResponseKeys: Record<string, string> = {
			inbox: 'inboxes',
			message: 'messages',
			thread: 'threads',
			webhook: 'webhooks',
		};

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject;

				// ----------------------------------
				//         Inbox
				// ----------------------------------
				if (resource === 'inbox') {
					if (operation === 'create') {
						const username = this.getNodeParameter('username', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						const body: IDataObject = { username };
						if (additionalFields.displayName) {
							body.display_name = additionalFields.displayName;
						}
						if (additionalFields.domain) {
							body.domain = additionalFields.domain;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'POST' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes`,
								body,
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
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = returnAll ? 0 : (this.getNodeParameter('limit', i) as number);
						const responseKey = listResponseKeys[resource];
						const allItems: IDataObject[] = [];
						let pageToken: string | undefined;
						const maxPages = 100;

						for (let page = 0; page < maxPages; page++) {
							const pageSize = returnAll ? 100 : Math.min(100, limit - allItems.length);
							const qs: IDataObject = { limit: pageSize };
							if (pageToken) qs.page_token = pageToken;

							const response = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'agentMailApi',
								{
									method: 'GET' as IHttpRequestMethods,
									url: `${baseUrl}/inboxes`,
									qs,
									json: true,
								},
							) as IDataObject;

							const pageItems = (response[responseKey] || []) as IDataObject[];
							allItems.push(...pageItems);

							if (!returnAll && allItems.length >= limit) break;
							if (!response.next_page_token) break;
							pageToken = response.next_page_token as string;
						}

						const results = returnAll ? allItems : allItems.slice(0, limit);
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(results),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
						continue;
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
						const messageOptions = this.getNodeParameter('messageOptions', i) as IDataObject;

						const body: IDataObject = {
							to: [to],
							subject,
							text: textBody,
						};
						if (messageOptions.htmlBody) {
							body.html = messageOptions.htmlBody;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'POST' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes/${inboxId}/messages/send`,
								body,
								json: true,
							},
						);
					} else if (operation === 'reply') {
						const inboxId = this.getNodeParameter('inboxId', i) as string;
						const messageId = this.getNodeParameter('messageId', i) as string;
						const textBody = this.getNodeParameter('textBody', i) as string;
						const messageOptions = this.getNodeParameter('messageOptions', i) as IDataObject;

						const body: IDataObject = {
							text: textBody,
						};
						if (messageOptions.htmlBody) {
							body.html = messageOptions.htmlBody;
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'POST' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes/${inboxId}/messages/${messageId}/reply`,
								body,
								json: true,
							},
						);
					} else if (operation === 'get') {
						const inboxId = this.getNodeParameter('inboxId', i) as string;
						const messageId = this.getNodeParameter('messageId', i) as string;
						responseData = await this.helpers.httpRequestWithAuthentication.call(
							this,
							'agentMailApi',
							{
								method: 'GET' as IHttpRequestMethods,
								url: `${baseUrl}/inboxes/${inboxId}/messages/${messageId}`,
								json: true,
							},
						);
					} else if (operation === 'list') {
						const inboxId = this.getNodeParameter('inboxId', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = returnAll ? 0 : (this.getNodeParameter('limit', i) as number);
						const responseKey = listResponseKeys[resource];
						const allItems: IDataObject[] = [];
						let pageToken: string | undefined;
						const maxPages = 100;

						for (let page = 0; page < maxPages; page++) {
							const pageSize = returnAll ? 100 : Math.min(100, limit - allItems.length);
							const qs: IDataObject = { limit: pageSize };
							if (pageToken) qs.page_token = pageToken;

							const response = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'agentMailApi',
								{
									method: 'GET' as IHttpRequestMethods,
									url: `${baseUrl}/inboxes/${inboxId}/messages`,
									qs,
									json: true,
								},
							) as IDataObject;

							const pageItems = (response[responseKey] || []) as IDataObject[];
							allItems.push(...pageItems);

							if (!returnAll && allItems.length >= limit) break;
							if (!response.next_page_token) break;
							pageToken = response.next_page_token as string;
						}

						const results = returnAll ? allItems : allItems.slice(0, limit);
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(results),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
						continue;
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
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = returnAll ? 0 : (this.getNodeParameter('limit', i) as number);
						const responseKey = listResponseKeys[resource];
						const allItems: IDataObject[] = [];
						let pageToken: string | undefined;
						const maxPages = 100;

						for (let page = 0; page < maxPages; page++) {
							const pageSize = returnAll ? 100 : Math.min(100, limit - allItems.length);
							const qs: IDataObject = { limit: pageSize };
							if (pageToken) qs.page_token = pageToken;

							const response = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'agentMailApi',
								{
									method: 'GET' as IHttpRequestMethods,
									url: `${baseUrl}/inboxes/${inboxId}/threads`,
									qs,
									json: true,
								},
							) as IDataObject;

							const pageItems = (response[responseKey] || []) as IDataObject[];
							allItems.push(...pageItems);

							if (!returnAll && allItems.length >= limit) break;
							if (!response.next_page_token) break;
							pageToken = response.next_page_token as string;
						}

						const results = returnAll ? allItems : allItems.slice(0, limit);
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(results),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
						continue;
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
									event_types: events,
								},
								json: true,
							},
						);
					} else if (operation === 'list') {
						const returnAll = this.getNodeParameter('returnAll', i) as boolean;
						const limit = returnAll ? 0 : (this.getNodeParameter('limit', i) as number);
						const responseKey = listResponseKeys[resource];
						const allItems: IDataObject[] = [];
						let pageToken: string | undefined;
						const maxPages = 100;

						for (let page = 0; page < maxPages; page++) {
							const pageSize = returnAll ? 100 : Math.min(100, limit - allItems.length);
							const qs: IDataObject = { limit: pageSize };
							if (pageToken) qs.page_token = pageToken;

							const response = await this.helpers.httpRequestWithAuthentication.call(
								this,
								'agentMailApi',
								{
									method: 'GET' as IHttpRequestMethods,
									url: `${baseUrl}/webhooks`,
									qs,
									json: true,
								},
							) as IDataObject;

							const pageItems = (response[responseKey] || []) as IDataObject[];
							allItems.push(...pageItems);

							if (!returnAll && allItems.length >= limit) break;
							if (!response.next_page_token) break;
							pageToken = response.next_page_token as string;
						}

						const results = returnAll ? allItems : allItems.slice(0, limit);
						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(results),
							{ itemData: { item: i } },
						);
						returnData.push(...executionData);
						continue;
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
				throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
