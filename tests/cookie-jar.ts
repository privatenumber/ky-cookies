import { setTimeout } from 'node:timers/promises';
import { describe, test, expect } from 'manten';
import { CookieJar } from 'tough-cookie';

describe('CookieJar (tough-cookie)', () => {
	describe('setCookie + getCookieString', () => {
		test('stores and retrieves a cookie', async () => {
			const jar = new CookieJar();
			await jar.setCookie('session=abc123', 'https://example.com/');
			expect(await jar.getCookieString('https://example.com/')).toBe('session=abc123');
		});

		test('stores multiple cookies', async () => {
			const jar = new CookieJar();
			await jar.setCookie('a=1', 'https://example.com/');
			await jar.setCookie('b=2', 'https://example.com/');
			const result = await jar.getCookieString('https://example.com/');
			expect(result).toContain('a=1');
			expect(result).toContain('b=2');
		});

		test('replaces cookie with same name+domain+path', async () => {
			const jar = new CookieJar();
			await jar.setCookie('a=1', 'https://example.com/');
			await jar.setCookie('a=2', 'https://example.com/');
			expect(await jar.getCookieString('https://example.com/')).toBe('a=2');
		});
	});

	describe('domain matching', () => {
		test('host-only cookie only matches exact host', async () => {
			const jar = new CookieJar();
			await jar.setCookie('a=1', 'https://example.com/');
			expect(await jar.getCookieString('https://example.com/')).toBe('a=1');
			expect(await jar.getCookieString('https://sub.example.com/')).toBe('');
		});

		test('domain cookie matches subdomains', async () => {
			const jar = new CookieJar();
			await jar.setCookie('a=1; Domain=example.com', 'https://example.com/');
			expect(await jar.getCookieString('https://sub.example.com/')).toBe('a=1');
		});

		test('rejects cookies on public suffixes', async () => {
			const jar = new CookieJar();
			await jar.setCookie('evil=1; Domain=co.uk', 'https://example.co.uk/').catch(() => {});
			expect(await jar.getCookieString('https://victim.co.uk/')).toBe('');
		});
	});

	describe('secure flag', () => {
		test('secure cookie only sent over https', async () => {
			const jar = new CookieJar();
			await jar.setCookie('a=1; Secure', 'https://example.com/');
			expect(await jar.getCookieString('https://example.com/')).toBe('a=1');
			expect(await jar.getCookieString('http://example.com/')).toBe('');
		});
	});

	describe('expiry', () => {
		test('expired cookies are not returned', async () => {
			const jar = new CookieJar();
			await jar.setCookie('a=1; Max-Age=0', 'https://example.com/');
			expect(await jar.getCookieString('https://example.com/')).toBe('');
		});

		test('naturally expired cookies are cleaned up', async () => {
			const jar = new CookieJar();
			await jar.setCookie('shortlived=1; Max-Age=1', 'https://example.com/');
			await jar.setCookie('permanent=2', 'https://example.com/');

			await setTimeout(1100);

			expect(await jar.getCookieString('https://example.com/')).toBe('permanent=2');
		}, 5000);
	});

	describe('sorting', () => {
		test('longer paths come first', async () => {
			const jar = new CookieJar();
			await jar.setCookie('root=1; Path=/', 'https://example.com/');
			await jar.setCookie('api=2; Path=/api', 'https://example.com/api');
			await jar.setCookie('users=3; Path=/api/users', 'https://example.com/api/users');
			expect(await jar.getCookieString('https://example.com/api/users')).toBe('users=3; api=2; root=1');
		});
	});
});
