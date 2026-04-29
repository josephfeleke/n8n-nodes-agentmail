import { AgentMail } from '../nodes/AgentMail/AgentMail.node';

describe('AgentMail node description', () => {
	const node = new AgentMail();
	const description = node.description;

	describe('top-level metadata', () => {
		it('has the expected display name and internal name', () => {
			expect(description.displayName).toBe('AgentMail');
			expect(description.name).toBe('agentMail');
		});

		it('has an icon and brand color', () => {
			expect(description.icon).toBe('file:agentmail.svg');
			expect(description.iconColor).toBe('black');
		});

		it('declares main inputs and outputs', () => {
			expect(description.inputs).toEqual(['main']);
			expect(description.outputs).toEqual(['main']);
		});

		it('is usable as an AI agent tool', () => {
			expect(description.usableAsTool).toBe(true);
		});

		it('requires the AgentMail API credential', () => {
			expect(description.credentials).toEqual([{ name: 'agentMailApi', required: true }]);
		});

		it('uses subtitle to show current resource and operation', () => {
			expect(description.subtitle).toContain('$parameter["operation"]');
			expect(description.subtitle).toContain('$parameter["resource"]');
		});
	});

	describe('Resource selector', () => {
		const resourceField = description.properties.find(
			(p) => p.name === 'resource' && !p.displayOptions,
		);

		it('exists and uses options type', () => {
			expect(resourceField).toBeDefined();
			expect(resourceField!.type).toBe('options');
		});

		it('lists exactly the four resources we support', () => {
			const values = (resourceField!.options as any[]).map((o) => o.value);
			expect(values.sort()).toEqual(['inbox', 'message', 'thread', 'webhook']);
		});

		it('lists resource names alphabetically', () => {
			const names = (resourceField!.options as any[]).map((o) => o.name);
			const sorted = [...names].sort();
			expect(names).toEqual(sorted);
		});
	});

	describe('Operation selectors', () => {
		const operationFields = description.properties.filter(
			(p) => p.name === 'operation' && p.displayOptions?.show?.resource,
		);

		it('has one operation field per resource', () => {
			expect(operationFields).toHaveLength(4);
		});

		it.each([
			['inbox', ['create', 'delete', 'get', 'list']],
			['message', ['get', 'list', 'reply', 'send']],
			['thread', ['get', 'list']],
			['webhook', ['create', 'delete', 'list']],
		])('%s has the expected operations', (resource, expected) => {
			const field = operationFields.find(
				(f) => (f.displayOptions!.show!.resource as string[])[0] === resource,
			);
			const values = (field!.options as any[]).map((o) => o.value).sort();
			expect(values).toEqual(expected);
		});

		it.each(['inbox', 'message', 'thread', 'webhook'])(
			'%s operations are sorted alphabetically by name',
			(resource) => {
				const field = operationFields.find(
					(f) => (f.displayOptions!.show!.resource as string[])[0] === resource,
				);
				const names = (field!.options as any[]).map((o) => o.name);
				expect(names).toEqual([...names].sort());
			},
		);
	});

	describe('Pagination fields', () => {
		it('has a returnAll boolean toggle for list operations', () => {
			const returnAll = description.properties.find((p) => p.name === 'returnAll');
			expect(returnAll).toBeDefined();
			expect(returnAll!.type).toBe('boolean');
			expect(returnAll!.default).toBe(false);
			expect(returnAll!.displayOptions!.show!.operation).toEqual(['list']);
		});

		it('has a limit field that only shows when returnAll is false', () => {
			const limit = description.properties.find((p) => p.name === 'limit');
			expect(limit).toBeDefined();
			expect(limit!.type).toBe('number');
			expect(limit!.displayOptions!.show!.returnAll).toEqual([false]);
			expect(limit!.typeOptions?.minValue).toBe(1);
		});
	});

	describe('Inbox dropdown', () => {
		const inboxFields = description.properties.filter(
			(p) => p.name === 'inboxId' && p.type === 'options',
		);

		it('uses loadOptionsMethod for dynamic options on every inbox field', () => {
			expect(inboxFields.length).toBeGreaterThan(0);
			for (const f of inboxFields) {
				expect(f.typeOptions?.loadOptionsMethod).toBe('getInboxes');
			}
		});

		it('has the standard "Name or ID" suffix required by n8n', () => {
			for (const f of inboxFields) {
				expect(f.displayName).toMatch(/Name or ID$/);
			}
		});
	});

	describe('API key notice banner', () => {
		it('has a notice with a link to the dashboard', () => {
			const notice = description.properties.find((p) => p.type === 'notice');
			expect(notice).toBeDefined();
			expect(notice!.displayName).toContain('agentmail.to/dashboard');
		});
	});

	describe('Webhook event multiOptions', () => {
		const events = description.properties.find(
			(p) =>
				p.name === 'events' && p.type === 'multiOptions',
		);

		it('lists all four event types alphabetically', () => {
			const names = (events!.options as any[]).map((o) => o.name);
			expect(names).toEqual(['Message Bounced', 'Message Delivered', 'Message Received', 'Message Sent']);
		});

		it('defaults to message.received', () => {
			expect(events!.default).toEqual(['message.received']);
		});
	});

	describe('Required fields', () => {
		it('requires username for inbox create', () => {
			const username = description.properties.find((p) => p.name === 'username');
			expect(username!.required).toBe(true);
		});

		it('requires Inbox, To, Subject, and Message for sending', () => {
			const send = (name: string) =>
				description.properties.find(
					(p) =>
						p.name === name &&
						p.displayOptions?.show?.operation?.includes('send'),
				);
			expect(send('inboxId')!.required).toBe(true);
			expect(send('to')!.required).toBe(true);
			expect(send('subject')!.required).toBe(true);
			expect(send('textBody')!.required).toBe(true);
		});
	});
});
