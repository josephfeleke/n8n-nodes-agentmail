import type { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions, IWebhookFunctions } from 'n8n-workflow';

export const createMockHttpRequest = (responses: any[] | any) => {
	let callIndex = 0;
	const responsesArray = Array.isArray(responses) ? responses : [responses];
	return jest.fn(function (this: any, _credName: string, _options: any) {
		const response = responsesArray[Math.min(callIndex, responsesArray.length - 1)];
		callIndex++;
		if (response instanceof Error) return Promise.reject(response);
		return Promise.resolve(response);
	}) as any;
};

export const createMockExecuteFunctions = (
	params: Record<string, any>,
	httpResponses: any[] | any = [{}],
	itemCount = 1,
): IExecuteFunctions => {
	const httpRequest = createMockHttpRequest(httpResponses);
	const items = Array.from({ length: itemCount }, () => ({ json: {} }));

	return {
		getInputData: jest.fn().mockReturnValue(items),
		getNodeParameter: jest.fn().mockImplementation((name: string, _i?: number, fallback?: any) => {
			if (name in params) return params[name];
			if (fallback !== undefined) return fallback;
			return undefined;
		}),
		getNode: jest.fn().mockReturnValue({ name: 'AgentMail', type: 'agentMail' }),
		continueOnFail: jest.fn().mockReturnValue(false),
		helpers: {
			httpRequestWithAuthentication: httpRequest,
			constructExecutionMetaData: jest.fn().mockImplementation((data: any[], meta: any) =>
				data.map((d: any) => ({ ...d, pairedItem: meta.itemData })),
			),
			returnJsonArray: jest.fn().mockImplementation((data: any) => {
				const arr = Array.isArray(data) ? data : [data];
				return arr.map((json) => ({ json }));
			}),
		},
		__httpRequestMock: httpRequest,
	} as any;
};

export const createMockLoadOptionsFunctions = (httpResponse: any): ILoadOptionsFunctions => {
	const httpRequest = createMockHttpRequest(httpResponse);
	return {
		helpers: {
			httpRequestWithAuthentication: httpRequest,
		},
		__httpRequestMock: httpRequest,
	} as any;
};

export const createMockHookFunctions = (
	params: Record<string, any>,
	staticData: Record<string, any>,
	httpResponses: any[] | any = [{}],
	webhookUrl = 'https://example.com/webhook/test',
): IHookFunctions => {
	const httpRequest = createMockHttpRequest(httpResponses);
	return {
		getNodeWebhookUrl: jest.fn().mockReturnValue(webhookUrl),
		getNodeParameter: jest.fn().mockImplementation((name: string) => params[name]),
		getWorkflowStaticData: jest.fn().mockReturnValue(staticData),
		getNode: jest.fn().mockReturnValue({ name: 'AgentMailTrigger', type: 'agentMailTrigger' }),
		helpers: {
			httpRequestWithAuthentication: httpRequest,
		},
		__httpRequestMock: httpRequest,
	} as any;
};

export const createMockWebhookFunctions = (
	params: Record<string, any>,
	body: Record<string, any>,
): IWebhookFunctions => {
	return {
		getBodyData: jest.fn().mockReturnValue(body),
		getNodeParameter: jest.fn().mockImplementation((name: string) => params[name]),
		helpers: {
			returnJsonArray: jest.fn().mockImplementation((data: any) => {
				const arr = Array.isArray(data) ? data : [data];
				return arr.map((json) => ({ json }));
			}),
		},
	} as any;
};
