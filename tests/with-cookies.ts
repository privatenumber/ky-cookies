import http from 'node:http';
import {
	describe, test, expect, onFinish,
} from 'manten';
import ky from 'ky';
import { CookieJar } from 'tough-cookie';
import { withCookies } from '../src/index.ts';

const createTestServer = (): Promise<{
	url: string;
	server: http.Server;
}> => new Promise((resolve) => {
	const server = http.createServer((request, response) => {
		const requestUrl = new URL(request.url!, `http://${request.headers.host}`);

		if (requestUrl.pathname === '/set-cookie') {
			const name = requestUrl.searchParams.get('name')!;
			const value = requestUrl.searchParams.get('value')!;
			const attributes = requestUrl.searchParams.get('attrs') || '';
			response.setHeader('Set-Cookie', `${name}=${value}${attributes ? `; ${attributes}` : ''}`);
			response.end('ok');
			return;
		}

		if (requestUrl.pathname === '/get-cookies') {
			response.setHeader('Content-Type', 'application/json');
			response.end(JSON.stringify({ cookie: request.headers.cookie || '' }));
			return;
		}

		if (requestUrl.pathname === '/multi-set') {
			response.setHeader('Set-Cookie', [
				'a=1; Path=/',
				'b=2; Path=/',
			]);
			response.end('ok');
			return;
		}

		if (requestUrl.pathname === '/bad-cookie') {
			// Malformed: empty name
			response.setHeader('Set-Cookie', '=invalid');
			response.end('ok');
			return;
		}

		response.statusCode = 404;
		response.end();
	});

	server.listen(0, '127.0.0.1', () => {
		const address = server.address() as { port: number };
		resolve({
			url: `http://127.0.0.1:${address.port}`,
			server,
		});
	});
});

describe('withCookies', () => {
	test('returns ky options with hooks', () => {
		const jar = new CookieJar();
		const options = withCookies(jar);
		expect(options.hooks).toBeDefined();
		expect(options.hooks!.beforeRequest).toHaveLength(1);
		expect(options.hooks!.afterResponse).toHaveLength(1);
	});

	describe('HTTP integration', async () => {
		const { url, server } = await createTestServer();
		onFinish(() => {
			server.close();
		});

		test('captures Set-Cookie from response and sends on next request', async () => {
			const jar = new CookieJar();
			const api = ky.extend(withCookies(jar));

			await api.get(`${url}/set-cookie?name=session&value=abc123`);
			const response = await api.get(`${url}/get-cookies`).json<{ cookie: string }>();
			expect(response.cookie).toBe('session=abc123');
		});

		test('handles multiple Set-Cookie headers', async () => {
			const jar = new CookieJar();
			const api = ky.extend(withCookies(jar));

			await api.get(`${url}/multi-set`);
			const response = await api.get(`${url}/get-cookies`).json<{ cookie: string }>();
			expect(response.cookie).toContain('a=1');
			expect(response.cookie).toContain('b=2');
		});

		test('merges jar cookies with existing Cookie header', async () => {
			const jar = new CookieJar();
			jar.setCookie('from_jar=1', `${url}/`);

			const api = ky.extend(withCookies(jar));
			const response = await api.get(`${url}/get-cookies`, {
				headers: { cookie: 'manual=2' },
			}).json<{ cookie: string }>();

			expect(response.cookie).toContain('from_jar=1');
			expect(response.cookie).toContain('manual=2');
		});

		test('silently ignores malformed Set-Cookie headers', async () => {
			const jar = new CookieJar();
			const api = ky.extend(withCookies(jar));

			// Should not throw
			await api.get(`${url}/bad-cookie`);
			expect(await jar.getCookieString(`${url}/`)).toBe('');
		});

		test('composes with ky.extend options', async () => {
			const jar = new CookieJar();
			const api = ky.extend({
				prefixUrl: url,
				...withCookies(jar),
			});

			await api.get('set-cookie?name=composed&value=yes');
			const response = await api.get('get-cookies').json<{ cookie: string }>();
			expect(response.cookie).toBe('composed=yes');
		});
	});
});
