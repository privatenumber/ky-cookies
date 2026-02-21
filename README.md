# ky-cookies

Cookie management plugin for [ky](https://github.com/sindresorhus/ky) using [tough-cookie](https://github.com/salesforce/tough-cookie).

- Full RFC 6265 compliance via tough-cookie (domain matching, PSL, expiry, SameSite)
- File persistence via [tough-cookie-file-store](https://github.com/ivanmarban/tough-cookie-file-store)
- TypeScript

## Install

```sh
npm install ky ky-cookies tough-cookie
```

## Usage

### In-memory cookies

```ts
import ky from 'ky';
import { CookieJar } from 'tough-cookie';
import { withCookies } from 'ky-cookies';

const jar = new CookieJar();
const api = ky.extend(withCookies(jar));

// Login — server sets session cookie
await api.post('https://example.com/login', {
  json: { username: 'admin', password: 'secret' },
});

// Subsequent requests automatically include the session cookie
const data = await api.get('https://example.com/dashboard').json();
```

### File persistence

Install [tough-cookie-file-store](https://github.com/ivanmarban/tough-cookie-file-store) for automatic file-based cookie storage:

```sh
npm install tough-cookie-file-store
```

```ts
import ky from 'ky';
import { CookieJar } from 'tough-cookie';
import FileCookieStore from 'tough-cookie-file-store';
import { withCookies } from 'ky-cookies';

const jar = new CookieJar(new FileCookieStore('./cookies.json'));
const api = ky.extend(withCookies(jar));

// Cookies automatically persist to disk on every Set-Cookie header
// On next run, cookies are loaded from the file
```

### Inspect cookies

```ts
import ky from 'ky';
import { CookieJar } from 'tough-cookie';
import { withCookies } from 'ky-cookies';

const jar = new CookieJar();
const api = ky.extend(withCookies(jar));

await api.get('https://example.com');

// See what cookies were set
const cookies = await jar.getCookies('https://example.com');
console.log(cookies);

// Clear cookies
await jar.removeAllCookies();
```

### Pre-seed cookies

```ts
import { CookieJar } from 'tough-cookie';
import { withCookies } from 'ky-cookies';

const jar = new CookieJar();
await jar.setCookie('session=abc123; Domain=example.com; Path=/', 'https://example.com');

const api = ky.extend(withCookies(jar));
// First request already includes the session cookie
```

### Multiple sessions

```ts
import { CookieJar } from 'tough-cookie';
import { withCookies } from 'ky-cookies';

const userA = ky.extend(withCookies(new CookieJar()));
const userB = ky.extend(withCookies(new CookieJar()));
// Each client has isolated cookies
```

### Composing with ky options

`withCookies()` returns a ky `Options` object, so it composes naturally:

```ts
import { CookieJar } from 'tough-cookie';
import { withCookies } from 'ky-cookies';

const api = ky.extend({
  prefixUrl: 'https://api.example.com',
  ...withCookies(new CookieJar()),
});
```

## API

### withCookies(jar)

Returns a ky `Options` object with `beforeRequest` and `afterResponse` hooks for automatic cookie management.

#### jar

Type: `CookieJar`

A [tough-cookie `CookieJar`](https://github.com/salesforce/tough-cookie#cookiejar) instance.

## Known Limitations

### Redirect cookies

When ky follows redirects (the default behavior), cookies set on intermediate redirect responses (3xx) are not captured. This is a limitation of the Fetch API — intermediate responses are handled internally and not visible to hooks.

In practice, most servers set cookies on the final response, not on redirects. If you need per-hop cookie handling, set `redirect: 'manual'` and follow redirects in your own hook.

## Sponsors

<p align="center">
	<a href="https://github.com/sponsors/privatenumber">
		<img src="https://cdn.jsdelivr.net/gh/privatenumber/sponsors/sponsorkit/sponsors.svg">
	</a>
</p>
