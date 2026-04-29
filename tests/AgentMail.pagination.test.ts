import { AgentMail } from '../nodes/AgentMail/AgentMail.node';
import { createMockExecuteFunctions } from './helpers';

describe('AgentMail pagination', () => {
	const node = new AgentMail();

	describe('returnAll = false (limit mode)', () => {
		it('respects the limit and stops after one page when API returns enough items', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'inbox',
					operation: 'list',
					returnAll: false,
					limit: 2,
				},
				{
					inboxes: [
						{ inbox_id: 'a' },
						{ inbox_id: 'b' },
						{ inbox_id: 'c' },
					],
					next_page_token: 'token1',
				},
			);

			const result = await node.execute.call(ctx);

			// Should only return 2 items even though API returned 3
			expect(result[0]).toHaveLength(2);
			expect(result[0].map((d) => d.json)).toEqual([{ inbox_id: 'a' }, { inbox_id: 'b' }]);
		});

		it('stops fetching when API returns fewer items than requested', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'inbox',
					operation: 'list',
					returnAll: false,
					limit: 50,
				},
				{
					inboxes: [{ inbox_id: 'a' }, { inbox_id: 'b' }],
					next_page_token: null,
				},
			);

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(2);
			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledTimes(1);
		});

		it('handles empty response (no inboxes key) without crashing', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'list', returnAll: false, limit: 10 },
				{ count: 0 },
			);

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(0);
		});

		it('handles explicitly empty inboxes array', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'list', returnAll: false, limit: 10 },
				{ inboxes: [] },
			);

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(0);
		});
	});

	describe('returnAll = true (full pagination)', () => {
		it('fetches all pages until next_page_token is missing', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'list', returnAll: true },
				[
					{
						inboxes: [{ inbox_id: 'a' }, { inbox_id: 'b' }],
						next_page_token: 'token1',
					},
					{
						inboxes: [{ inbox_id: 'c' }, { inbox_id: 'd' }],
						next_page_token: 'token2',
					},
					{
						inboxes: [{ inbox_id: 'e' }],
						next_page_token: null,
					},
				],
			);

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(5);
			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledTimes(3);
			// Second call should include the page token from the first response
			expect(httpMock.mock.calls[1][1].qs.page_token).toBe('token1');
			expect(httpMock.mock.calls[2][1].qs.page_token).toBe('token2');
		});

		it('caps at 100 pages to prevent runaway loops if API never returns null token', async () => {
			// API always returns a token (broken API behavior)
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'list', returnAll: true },
				{
					inboxes: [{ inbox_id: 'a' }],
					next_page_token: 'never_ends',
				},
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledTimes(100);
		});

		it('passes limit=100 per page when fetching all', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'list', returnAll: true },
				{ inboxes: [], next_page_token: null },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock.mock.calls[0][1].qs.limit).toBe(100);
		});
	});

	describe('Cross-resource pagination', () => {
		it.each([
			['inbox', 'inboxes', 'https://api.agentmail.to/v0/inboxes'],
			['webhook', 'webhooks', 'https://api.agentmail.to/v0/webhooks'],
		])('extracts items from the %s response key', async (resource, key, url) => {
			const ctx = createMockExecuteFunctions(
				{ resource, operation: 'list', returnAll: false, limit: 5 },
				{ [key]: [{ id: '1' }, { id: '2' }], next_page_token: null },
			);

			const result = await node.execute.call(ctx);
			expect(result[0]).toHaveLength(2);
			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock.mock.calls[0][1].url).toBe(url);
		});

		it('messages list uses /inboxes/{id}/messages with messages key', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'message',
					operation: 'list',
					returnAll: false,
					limit: 10,
					inboxId: 'inbox_a',
				},
				{ messages: [{ message_id: 'm1' }], next_page_token: null },
			);

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(1);
			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock.mock.calls[0][1].url).toBe(
				'https://api.agentmail.to/v0/inboxes/inbox_a/messages',
			);
		});

		it('threads list uses /inboxes/{id}/threads with threads key', async () => {
			const ctx = createMockExecuteFunctions(
				{
					resource: 'thread',
					operation: 'list',
					returnAll: false,
					limit: 10,
					inboxId: 'inbox_a',
				},
				{ threads: [{ thread_id: 't1' }], next_page_token: null },
			);

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(1);
			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock.mock.calls[0][1].url).toBe(
				'https://api.agentmail.to/v0/inboxes/inbox_a/threads',
			);
		});
	});

	describe('Page size optimization', () => {
		it('requests exactly limit items on first call when limit < 100', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'list', returnAll: false, limit: 7 },
				{ inboxes: [], next_page_token: null },
			);

			await node.execute.call(ctx);

			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock.mock.calls[0][1].qs.limit).toBe(7);
		});

		it('caps page size at 100 when limit > 100', async () => {
			const ctx = createMockExecuteFunctions(
				{ resource: 'inbox', operation: 'list', returnAll: false, limit: 250 },
				[
					{ inboxes: Array(100).fill({ id: 'x' }), next_page_token: 't1' },
					{ inboxes: Array(100).fill({ id: 'x' }), next_page_token: 't2' },
					{ inboxes: Array(50).fill({ id: 'x' }), next_page_token: null },
				],
			);

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(250);
			const httpMock = (ctx as any).__httpRequestMock;
			// All pages capped at 100
			expect(httpMock.mock.calls[0][1].qs.limit).toBe(100);
			expect(httpMock.mock.calls[1][1].qs.limit).toBe(100);
		});
	});
});
