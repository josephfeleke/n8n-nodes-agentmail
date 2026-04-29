import { AgentMailTrigger } from '../nodes/AgentMail/AgentMailTrigger.node';
import { createMockWebhookFunctions } from './helpers';

describe('AgentMailTrigger webhook handler', () => {
	const node = new AgentMailTrigger();

	const buildEvent = (overrides: any = {}) => ({
		type: 'message.received',
		event_id: 'evt_123',
		timestamp: '2026-04-13T10:00:00Z',
		data: {
			message_id: 'msg_456',
			inbox_id: 'inbox_789',
			thread_id: 'thread_012',
			from: 'sender@example.com',
			to: ['agent@agentmail.to'],
			subject: 'Hello',
			text: 'Plain text',
			html: '<p>HTML</p>',
			labels: ['received'],
			attachments: [],
			...overrides.data,
		},
		...overrides,
	});

	describe('event filtering', () => {
		it('triggers when event type matches subscription', async () => {
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: '' },
				buildEvent(),
			);

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toBeDefined();
			expect(result.noWebhookResponse).toBeUndefined();
		});

		it('does NOT trigger when event type does not match subscription', async () => {
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: '' },
				buildEvent({ type: 'message.sent' }),
			);

			const result = await node.webhook.call(ctx);

			expect(result.noWebhookResponse).toBe(true);
			expect(result.workflowData).toBeUndefined();
		});

		it('reads event type from body.event when body.type is missing', async () => {
			const event: any = buildEvent();
			delete event.type;
			event.event = 'message.received';

			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: '' },
				event,
			);

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toBeDefined();
		});
	});

	describe('inbox filter', () => {
		it('triggers when inboxFilter is empty (all inboxes)', async () => {
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: '' },
				buildEvent({ data: { inbox_id: 'inbox_anything' } }),
			);

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toBeDefined();
		});

		it('triggers when inbox_id matches the filter', async () => {
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: 'inbox_specific' },
				buildEvent({ data: { inbox_id: 'inbox_specific' } }),
			);

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toBeDefined();
		});

		it('does NOT trigger when inbox_id does not match filter', async () => {
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: 'inbox_specific' },
				buildEvent({ data: { inbox_id: 'inbox_different' } }),
			);

			const result = await node.webhook.call(ctx);

			expect(result.noWebhookResponse).toBe(true);
		});

		it('handles camelCase inboxId in payload as well as snake_case', async () => {
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: 'inbox_specific' },
				{
					type: 'message.received',
					data: { inboxId: 'inbox_specific' },
				},
			);

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toBeDefined();
		});
	});

	describe('output data shape', () => {
		it('flattens message data alongside event metadata', async () => {
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: '' },
				buildEvent(),
			);

			const result = await node.webhook.call(ctx);
			const output = result.workflowData![0][0].json;

			expect(output).toMatchObject({
				event: 'message.received',
				eventId: 'evt_123',
				timestamp: '2026-04-13T10:00:00Z',
				messageId: 'msg_456',
				inboxId: 'inbox_789',
				threadId: 'thread_012',
				from: 'sender@example.com',
				to: ['agent@agentmail.to'],
				subject: 'Hello',
				text: 'Plain text',
				html: '<p>HTML</p>',
				labels: ['received'],
				attachments: [],
			});
		});

		it('includes the raw payload for advanced use cases', async () => {
			const event = buildEvent();
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: '' },
				event,
			);

			const result = await node.webhook.call(ctx);
			const output = result.workflowData![0][0].json as any;

			expect(output.rawPayload).toEqual(event);
		});

		it('falls back to body for text when message.body is set instead of message.text', async () => {
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: '' },
				{
					type: 'message.received',
					data: { body: 'fallback text' },
				},
			);

			const result = await node.webhook.call(ctx);
			expect((result.workflowData![0][0].json as any).text).toBe('fallback text');
		});

		it('handles missing data field gracefully', async () => {
			const ctx = createMockWebhookFunctions(
				{ event: 'message.received', inboxFilter: '' },
				{ type: 'message.received' },
			);

			const result = await node.webhook.call(ctx);

			expect(result.workflowData).toBeDefined();
			const output = result.workflowData![0][0].json as any;
			expect(output.event).toBe('message.received');
		});
	});
});
