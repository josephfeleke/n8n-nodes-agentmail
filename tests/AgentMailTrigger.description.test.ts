import { AgentMailTrigger } from '../nodes/AgentMail/AgentMailTrigger.node';

describe('AgentMailTrigger description', () => {
	const node = new AgentMailTrigger();
	const description = node.description;

	it('has correct metadata', () => {
		expect(description.displayName).toBe('AgentMail Trigger');
		expect(description.name).toBe('agentMailTrigger');
		expect(description.group).toEqual(['trigger']);
	});

	it('has no inputs (it is a trigger)', () => {
		expect(description.inputs).toEqual([]);
	});

	it('has main output', () => {
		expect(description.outputs).toEqual(['main']);
	});

	it('is usable as an AI agent tool', () => {
		expect(description.usableAsTool).toBe(true);
	});

	it('declares a webhook', () => {
		expect(description.webhooks).toBeDefined();
		expect(description.webhooks).toHaveLength(1);
		expect(description.webhooks![0]).toMatchObject({
			httpMethod: 'POST',
			responseMode: 'onReceived',
			path: 'webhook',
		});
	});

	it('has triggerPanel with helpful copy', () => {
		expect(description.triggerPanel).toBeDefined();
		const panel = description.triggerPanel as any;
		expect(panel.executionsHelp.inactive).toBeTruthy();
		expect(panel.executionsHelp.active).toBeTruthy();
	});

	it('has activationMessage shown when workflow is activated', () => {
		expect(description.activationMessage).toBeTruthy();
	});

	describe('event options', () => {
		const eventField = description.properties.find((p) => p.name === 'event');

		it('lists all four supported event types alphabetically', () => {
			const names = (eventField!.options as any[]).map((o) => o.name);
			expect(names).toEqual([
				'Email Bounced',
				'Email Delivered',
				'Email Received',
				'Email Sent',
			]);
		});

		it('defaults to message.received', () => {
			expect(eventField!.default).toBe('message.received');
		});

		it('is required', () => {
			expect(eventField!.required).toBe(true);
		});
	});

	describe('inbox filter', () => {
		const filterField = description.properties.find((p) => p.name === 'inboxFilter');

		it('uses dynamic dropdown for inbox selection', () => {
			expect(filterField!.type).toBe('options');
			expect(filterField!.typeOptions?.loadOptionsMethod).toBe('getInboxes');
		});

		it('has the standard "Name or ID" suffix', () => {
			expect(filterField!.displayName).toMatch(/Name or ID$/);
		});

		it('defaults to empty (all inboxes)', () => {
			expect(filterField!.default).toBe('');
		});
	});
});
