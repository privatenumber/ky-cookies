import type { Options } from 'ky';
import type { CookieJar } from 'tough-cookie';

export const withCookies = (
	jar: CookieJar,
): Options => ({
	hooks: {
		beforeRequest: [
			async (request) => {
				const jarCookies = await jar.getCookieString(request.url);
				if (jarCookies) {
					const existing = request.headers.get('cookie');
					request.headers.set(
						'cookie',
						existing ? `${existing}; ${jarCookies}` : jarCookies,
					);
				}
			},
		],
		afterResponse: [
			async (request, _options, response) => {
				const setCookieHeaders = response.headers.getSetCookie();
				for (const header of setCookieHeaders) {
					try {
						await jar.setCookie(header, request.url);
					} catch {
						// Silently ignore malformed Set-Cookie headers
					}
				}
			},
		],
	},
});
