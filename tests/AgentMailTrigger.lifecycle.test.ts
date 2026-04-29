import { AgentMailTrigger } from '../nodes/AgentMail/AgentMailTrigger.node';
import { createMockHookFunctions } from './helpers';

describe('AgentMailTrigger webhook lifecycle', () => {
	const node = new AgentMailTrigger();
	const lifecycle = node.webhookMethods!.default;
	const baseUrl = 'https://api.agentmail.to/v0';
	const testWebhookUrl = 'https://example.com/webhook/abc';

	describe('checkExists', () => {
		it('returns true when stored webhookId is verified by API', async () => {
			const ctx = createMockHookFunctions(
				{ event: 'message.received' },
				{ webhookId: 'wh_existing' },
				{ webhook_id: 'wh_existing' },
				testWebhookUrl,
			);

			const result = await lifecycle.checkExists!.call(ctx);

			expect(result).toBe(true);
			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock.mock.calls[0][1].url).toBe(`${baseUrl}/webhooks/wh_existing`);
		});

		it('clears stale webhookId and returns false when verify fails (404)', async () => {
			const staticData: any = { webhookId: 'wh_deleted' };
			const ctx = createMockHookFunctions(
				{ event: 'message.received' },
				staticData,
				new Error('404 not found'),
				testWebhookUrl,
			);

			const result = await lifecycle.checkExists!.call(ctx);

			// In current code, when stored verify fails, we delete the ID and return false.
			expect(result).toBe(false);
			expect(staticData.webhookId).toBeUndefined();
		});

		it('finds matching URL in webhook list when no stored ID', async () => {
			const staticData: any = {};
			const ctx = createMockHookFunctions(
				{ event: 'message.received' },
				staticData,
				{
					webhooks: [
						{ webhook_id: 'wh_other', url: 'https://different.example.com' },
						{ webhook_id: 'wh_match', url: testWebhookUrl },
					],
				},
				testWebhookUrl,
			);

			const result = await lifecycle.checkExists!.call(ctx);

			expect(result).toBe(true);
			expect(staticData.webhookId).toBe('wh_match');
		});

		it('returns false when no matching webhook URL is in the list', async () => {
			const ctx = createMockHookFunctions(
				{ event: 'message.received' },
				{},
				{ webhooks: [{ webhook_id: 'wh_other', url: 'https://different.example.com' }] },
				testWebhookUrl,
			);

			const result = await lifecycle.checkExists!.call(ctx);

			expect(result).toBe(false);
		});

		it('propagates list errors instead of swallowing them silently', async () => {
			// This is the critical n8n review fix: list failures must surface,
			// not silently return false (which would cause duplicate webhooks)
			const ctx = createMockHookFunctions(
				{ event: 'message.received' },
				{},
				new Error('Auth failed'),
				testWebhookUrl,
			);

			await expect(lifecycle.checkExists!.call(ctx)).rejects.toThrow('Auth failed');
		});
	});

	describe('create', () => {
		it('POSTs /webhooks with the n8n-generated URL and event_types array', async () => {
			const staticData: any = {};
			const ctx = createMockHookFunctions(
				{ event: 'message.received' },
				staticData,
				{ webhook_id: 'wh_new' },
				testWebhookUrl,
			);

			const result = await lifecycle.create.call(ctx);

			expect(result).toBe(true);
			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({
					method: 'POST',
					url: `${baseUrl}/webhooks`,
					body: {
						url: testWebhookUrl,
						event_types: ['message.received'],
					},
				}),
			);
			expect(staticData.webhookId).toBe('wh_new');
		});

		it('throws NodeApiError with actionable message when registration fails', async () => {
			// Critical n8n review fix: don't return false silently
			const ctx = createMockHookFunctions(
				{ event: 'message.received' },
				{},
				new Error('401 Unauthorized'),
				testWebhookUrl,
			);

			await expect(lifecycle.create.call(ctx)).rejects.toThrow();
			// The error should bubble up, not silently return false.
		});

		it('extracts webhook ID from any of webhook_id, id, or webhook.id', async () => {
			const tests = [
				{ webhook_id: 'a' },
				{ id: 'a' },
				{ webhook: { id: 'a' } },
			];

			for (const response of tests) {
				const staticData: any = {};
				const ctx = createMockHookFunctions(
					{ event: 'message.received' },
					staticData,
					response,
				);
				await lifecycle.create.call(ctx);
				expect(staticData.webhookId).toBe('a');
			}
		});
	});

	describe('delete', () => {
		it('returns true immediately when no webhookId is stored', async () => {
			const ctx = createMockHookFunctions({ event: 'message.received' }, {});

			const result = await lifecycle.delete!.call(ctx);

			expect(result).toBe(true);
			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).not.toHaveBeenCalled();
		});

		it('DELETEs /webhooks/{id} and clears the stored ID', async () => {
			const staticData: any = { webhookId: 'wh_to_delete' };
			const ctx = createMockHookFunctions(
				{ event: 'message.received' },
				staticData,
				{ deleted: true },
			);

			const result = await lifecycle.delete!.call(ctx);

			expect(result).toBe(true);
			expect(staticData.webhookId).toBeUndefined();
			const httpMock = (ctx as any).__httpRequestMock;
			expect(httpMock).toHaveBeenCalledWith(
				'agentMailApi',
				expect.objectContaining({
					method: 'DELETE',
					url: `${baseUrl}/webhooks/wh_to_delete`,
				}),
			);
		});

		it('still clears the stored ID even if API delete errors (idempotent cleanup)', async () => {
			const staticData: any = { webhookId: 'wh_to_delete' };
			const ctx = createMockHookFunctions(
				{ event: 'message.received' },
				staticData,
				new Error('404'),
			);

			const result = await lifecycle.delete!.call(ctx);

			expect(result).toBe(true);
			expect(staticData.webhookId).toBeUndefined();
		});
	});
});
