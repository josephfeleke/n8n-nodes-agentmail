import { AgentMail } from '../nodes/AgentMail/AgentMail.node';
import { AgentMailTrigger } from '../nodes/AgentMail/AgentMailTrigger.node';
import { createMockLoadOptionsFunctions } from './helpers';

describe('loadOptions: getInboxes', () => {
	const node = new AgentMail();
	const triggerNode = new AgentMailTrigger();

	it('exists on the AgentMail node', () => {
		expect(node.methods?.loadOptions?.getInboxes).toBeDefined();
	});

	it('exists on the AgentMail Trigger node', () => {
		expect(triggerNode.methods?.loadOptions?.getInboxes).toBeDefined();
	});

	it('hits /inboxes with limit=100', async () => {
		const ctx = createMockLoadOptionsFunctions({
			inboxes: [{ inbox_id: 'a', email: 'a@agentmail.to' }],
		});

		await node.methods!.loadOptions!.getInboxes.call(ctx);

		const httpMock = (ctx as any).__httpRequestMock;
		expect(httpMock).toHaveBeenCalledWith(
			'agentMailApi',
			expect.objectContaining({
				method: 'GET',
				url: 'https://api.agentmail.to/v0/inboxes',
				qs: { limit: 100 },
			}),
		);
	});

	it('returns email as the display name', async () => {
		const ctx = createMockLoadOptionsFunctions({
			inboxes: [
				{ inbox_id: 'a', email: 'agent1@agentmail.to' },
				{ inbox_id: 'b', email: 'agent2@agentmail.to' },
			],
		});

		const options = await node.methods!.loadOptions!.getInboxes.call(ctx);

		expect(options).toEqual([
			{ name: 'agent1@agentmail.to', value: 'a' },
			{ name: 'agent2@agentmail.to', value: 'b' },
		]);
	});

	it('falls back to username@domain when email is missing', async () => {
		const ctx = createMockLoadOptionsFunctions({
			inboxes: [{ inbox_id: 'a', username: 'fallback', domain: 'custom.com' }],
		});

		const options = await node.methods!.loadOptions!.getInboxes.call(ctx);

		expect(options[0].name).toBe('fallback@custom.com');
	});

	it('falls back to agentmail.to as default domain', async () => {
		const ctx = createMockLoadOptionsFunctions({
			inboxes: [{ inbox_id: 'a', username: 'fallback' }],
		});

		const options = await node.methods!.loadOptions!.getInboxes.call(ctx);

		expect(options[0].name).toBe('fallback@agentmail.to');
	});

	it('handles empty inboxes array', async () => {
		const ctx = createMockLoadOptionsFunctions({ inboxes: [] });
		const options = await node.methods!.loadOptions!.getInboxes.call(ctx);
		expect(options).toEqual([]);
	});

	it('handles missing inboxes key', async () => {
		const ctx = createMockLoadOptionsFunctions({ count: 0 });
		const options = await node.methods!.loadOptions!.getInboxes.call(ctx);
		expect(options).toEqual([]);
	});

	it('uses inbox_id as value, falling back to id', async () => {
		const ctx = createMockLoadOptionsFunctions({
			inboxes: [
				{ inbox_id: 'preferred', email: 'a@x.com' },
				{ id: 'fallback', email: 'b@x.com' },
			],
		});

		const options = await node.methods!.loadOptions!.getInboxes.call(ctx);

		expect(options[0].value).toBe('preferred');
		expect(options[1].value).toBe('fallback');
	});

	describe('Trigger node loadOptions adds "All Inboxes" option', () => {
		it('prepends an empty-value "All Inboxes" option', async () => {
			const ctx = createMockLoadOptionsFunctions({
				inboxes: [{ inbox_id: 'a', email: 'a@agentmail.to' }],
			});

			const options = await triggerNode.methods!.loadOptions!.getInboxes.call(ctx);

			expect(options[0]).toEqual({ name: 'All Inboxes', value: '' });
			expect(options).toHaveLength(2);
		});

		it('returns just the All Inboxes option when there are no inboxes', async () => {
			const ctx = createMockLoadOptionsFunctions({ inboxes: [] });
			const options = await triggerNode.methods!.loadOptions!.getInboxes.call(ctx);
			expect(options).toEqual([{ name: 'All Inboxes', value: '' }]);
		});
	});
});
