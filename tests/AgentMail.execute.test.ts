import { AgentMail } from '../nodes/AgentMail/AgentMail.node';
import { createMockExecuteFunctions } from './helpers';

describe('AgentMail execute()', () => {
	const node = new AgentMail();
	const baseUrl = 'https://api.agentmail.to/v0';

	describe('Inbox operations', () => {
		it('Create posts to /inboxes with username only when additional fields are empty', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'inbox',
					operation: 'create',
					username: 'my-agent',
					additionalFields: {},
				},
				{ inbox_id: 'inbox_123', email: 'my-agent@agentmail.to' },
			);

			const result = await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({
					method: 'POST',
					url: `${baseUrl}/inboxes`,
					body: { username: 'my-agent' },
				}),
			);
			expect(result[0][0].json).toMatchObject({ inbox_id: 'inbox_123' });
		});

		it('Create includes display_name and domain when set in additional fields', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'inbox',
					operation: 'create',
					username: 'my-agent',
					additionalFields: { displayName: 'My Bot', domain: 'custom.com' },
				},
				{ inbox_id: 'inbox_123' },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({
					body: { username: 'my-agent', display_name: 'My Bot', domain: 'custom.com' },
				}),
			);
		});

		it('Get hits /inboxes/{id}', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'get', inboxId: 'inbox_abc' },
				{ inbox_id: 'inbox_abc', email: 'test@agentmail.to' },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({ method: 'GET', url: `${baseUrl}/inboxes/inbox_abc` }),
			);
		});

		it('Delete hits DELETE /inboxes/{id}', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'delete', inboxId: 'inbox_abc' },
				{ deleted: true },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({ method: 'DELETE', url: `${baseUrl}/inboxes/inbox_abc` }),
			);
		});
	});

	describe('Message operations', () => {
		it('Send hits /inboxes/{id}/messages/send (not /messages)', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'message',
					operation: 'send',
					inboxId: 'inbox_a',
					to: 'recipient@example.com',
					subject: 'Hi',
					textBody: 'Hello world',
					messageOptions: {},
				},
				{ message_id: 'msg_1' },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({
					method: 'POST',
					url: `${baseUrl}/inboxes/inbox_a/messages/send`,
					body: {
						to: ['recipient@example.com'],
						subject: 'Hi',
						text: 'Hello world',
					},
				}),
			);
		});

		it('Send includes html when provided in messageOptions', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'message',
					operation: 'send',
					inboxId: 'inbox_a',
					to: 'r@e.com',
					subject: 'S',
					textBody: 'T',
					messageOptions: { htmlBody: '<p>HTML</p>' },
				},
				{ message_id: 'msg_2' },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			const callArgs = httpMock.mock.calls[0][1];
			expect(callArgs.body.html).toBe('<p>HTML</p>');
		});

		it('Reply hits /inboxes/{id}/messages/{id}/reply (full path with inbox)', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'message',
					operation: 'reply',
					inboxId: 'inbox_a',
					messageId: 'msg_xyz',
					textBody: 'Reply text',
					messageOptions: {},
				},
				{ message_id: 'msg_3' },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({
					method: 'POST',
					url: `${baseUrl}/inboxes/inbox_a/messages/msg_xyz/reply`,
					body: { text: 'Reply text' },
				}),
			);
		});

		it('Get hits /inboxes/{id}/messages/{id} (not bare /messages)', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'message',
					operation: 'get',
					inboxId: 'inbox_a',
					messageId: 'msg_xyz',
				},
				{ message_id: 'msg_xyz' },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({
					method: 'GET',
					url: `${baseUrl}/inboxes/inbox_a/messages/msg_xyz`,
				}),
			);
		});
	});

	describe('Thread operations', () => {
		it('Get hits /threads/{id}', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'thread', operation: 'get', threadId: 'thr_1' },
				{ thread_id: 'thr_1' },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({ method: 'GET', url: `${baseUrl}/threads/thr_1` }),
			);
		});
	});

	describe('Webhook operations', () => {
		it('Create uses event_types (not events) in the body', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'webhook',
					operation: 'create',
					webhookUrl: 'https://example.com/hook',
					events: ['message.received', 'message.sent'],
				},
				{ webhook_id: 'wh_1' },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			const callArgs = httpMock.mock.calls[0][1];
			expect(callArgs.body).toEqual({
				url: 'https://example.com/hook',
				event_types: ['message.received', 'message.sent'],
			});
			expect(callArgs.body.events).toBeUndefined();
		});

		it('Delete hits DELETE /webhooks/{id}', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'webhook', operation: 'delete', webhookId: 'wh_1' },
				{ deleted: true },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({ method: 'DELETE', url: `${baseUrl}/webhooks/wh_1` }),
			);
		});
	});

	describe('Multiple input items', () => {
		it('processes each item in the input array independently', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'get', inboxId: 'inbox_a' },
				[{ inbox_id: 'inbox_a' }, { inbox_id: 'inbox_a' }, { inbox_id: 'inbox_a' }],
				3,
			);

			const result = await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledTimes(3);
			expect(result[0]).toHaveLength(3);
		});
	});

	describe('Error handling', () => {
		it('throws when an API call fails and continueOnFail is false', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'get', inboxId: 'inbox_a' },
				new Error('API down'),
			);

			await expect(node.execute.call(ctx)).rejects.toThrow();
		});

		it('returns the error in the data when continueOnFail is true', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'get', inboxId: 'inbox_a' },
				new Error('API down'),
			);
			(ctx.continueOnFail as any).mockReturnValue(true);

			const result = await node.execute.call(ctx);

			expect(result[0][0].json).toEqual({ error: 'API down' });
			expect(result[0][0].pairedItem).toEqual({ item: 0 });
		});
	});
});
