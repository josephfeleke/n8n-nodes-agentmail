import { AgentMailApi } from '../credentials/AgentMailApi.credentials';

describe('AgentMailApi credential', () => {
	const cred = new AgentMailApi();

	it('has the correct internal name and display name', () => {
		expect(cred.name).toBe('agentMailApi');
		expect(cred.displayName).toBe('AgentMail API');
	});

	it('has an icon (required for n8n verification)', () => {
		expect(cred.icon).toBeDefined();
		expect(cred.icon).toContain('agentmail.svg');
	});

	it('has documentation URL pointing to the AgentMail docs', () => {
		expect(cred.documentationUrl).toBe('https://docs.agentmail.to');
	});

	describe('properties', () => {
		const apiKey = cred.properties.find((p) => p.name === 'apiKey');

		it('has an apiKey field', () => {
			expect(apiKey).toBeDefined();
		});

		it('apiKey is required', () => {
			expect(apiKey!.required).toBe(true);
		});

		it('apiKey is masked (password type)', () => {
			expect(apiKey!.typeOptions?.password).toBe(true);
		});

		it('has a description with link to dashboard', () => {
			expect(apiKey!.description).toContain('agentmail.to/dashboard');
		});
	});

	describe('authenticate', () => {
		it('uses Bearer token in Authorization header', () => {
			expect(cred.authenticate.type).toBe('generic');
			const properties = cred.authenticate.properties as any;
			expect(properties.headers.Authorization).toContain('Bearer');
			expect(properties.headers.Authorization).toContain('apiKey');
		});
	});

	describe('test', () => {
		it('hits a real endpoint to verify the credential works', () => {
			const test = cred.test as any;
			expect(test.request.baseURL).toBe('https://api.agentmail.to/v0');
			expect(test.request.url).toBe('/inboxes');
			expect(test.request.method).toBe('GET');
		});
	});
});
