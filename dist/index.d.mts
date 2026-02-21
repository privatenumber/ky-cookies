import { Options } from 'ky';
import { CookieJar } from 'tough-cookie';

declare const withCookies: (jar: CookieJar) => Options;

export { withCookies };
