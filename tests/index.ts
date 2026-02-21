import { describe } from 'manten';

describe('ky-cookies', async () => {
	await import('./cookie-jar.ts');
	await import('./with-cookies.ts');
});
