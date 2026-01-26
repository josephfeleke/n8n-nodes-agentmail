import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AgentMailApi implements ICredentialType {
	name = 'agentMailApi';
	displayName = 'AgentMail API';
	documentationUrl = 'https://docs.agentmail.to';
	
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your AgentMail API key. Get it from https://agentmail.to/dashboard',
		},
	];

	// This allows the credential to be used by other nodes
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.apiKey}}',
			},
		},
	};

	// Test the credentials by listing inboxes
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.agentmail.to/v0',
			url: '/inboxes',
			method: 'GET',
		},
	};
}
