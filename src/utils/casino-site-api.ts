/**
 * Casino Site API — https://casino.optikpi-hz.com
 *
 * Structured client with four core operations:
 *   - register()   POST /api/auth/register
 *   - login()      POST /api/auth/callback/credentials  (NextAuth, CSRF-aware)
 *   - logout()     POST /api/auth/signout               (NextAuth, CSRF-aware)
 *   - deposit()    POST /api/transaction/
 *
 * Usage (functional exports — for use inside step / test code):
 *   import { CasinoApi } from './casino-site-api';
 *
 *   const session = await CasinoApi.login({ name: 'bala_demo', password: 'casino@optikpi' });
 *   await CasinoApi.deposit(100, session.cookies);
 *   await CasinoApi.logout(session.cookies);
 *
 * Or use the low-level named exports directly:
 *   import { getCsrfToken, loginToCasino, registerToCasino, logoutFromCasino, deposit } from './casino-site-api';
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterPayload {
    firstName: string;
    lastName:  string;
    country:   string;
    email:     string;
    username:  string;
    password:  string;
    phone:     string;
    currency:  string;
    language:  string;
}

export interface RegisterResponse {
    success:  boolean;
    message?: string;
    userId?:  string;
    [key: string]: unknown;
}

export interface CsrfResponse {
    csrfToken: string;
}

export interface LoginCredentials {
    name:     string;
    password: string;
}

export interface LoginResult {
    body:    any;
    cookies: string;
}

export interface LogoutResult {
    success: boolean;
    body:    any;
}

export interface SessionUser {
    id:             string;
    name:           string;
    email:          string;
    emailVerified:  boolean;
    firstName:      string;
    lastName:       string;
    phone:          string | null;
    phoneVerified:  boolean;
    balance:        number;
    currency:       string | null;
    language:       string | null;
    workspaceId:    string;
}

export interface TransactionPayload {
    actionType: 'DEPOSIT_PUBSUB_SUCCESS' | string;
    amount:     number;
    type:       'deposit' | 'withdrawal' | string;
}

export interface TransactionResponse {
    success: boolean;
    [key: string]: unknown;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CASINO_BASE_URL = 'https://casino.optikpi-hz.com';

export const CASINO_ENDPOINTS = {
    REGISTER:    `${CASINO_BASE_URL}/api/auth/register`,
    CSRF:        `${CASINO_BASE_URL}/api/auth/csrf`,
    LOGIN:       `${CASINO_BASE_URL}/api/auth/callback/credentials`,
    LOGOUT:      `${CASINO_BASE_URL}/api/auth/signout`,
    SESSION:     `${CASINO_BASE_URL}/api/auth/session`,
    TRANSACTION: `${CASINO_BASE_URL}/api/transaction/`,
} as const;

const DEFAULT_CREDENTIALS: LoginCredentials = {
    name:     'bala_demo',
    password: 'casino@optikpi',
};

const CALLBACK_URL = `${CASINO_BASE_URL}/sign-in`;

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Extract key=value cookie pairs from set-cookie response headers.
 * Uses getSetCookie() (Node 18+) for correct multi-header parsing.
 */
function extractCookies(response: Response): string {
    const setCookieHeaders: string[] =
        typeof (response.headers as any).getSetCookie === 'function'
            ? (response.headers as any).getSetCookie()
            : (response.headers.get('set-cookie') ?? '').split(/,(?=[^ ])/g);

    return setCookieHeaders
        .map((c: string) => c.split(';')[0].trim())
        .filter(Boolean)
        .join('; ');
}

/**
 * Generic fetch with JSON body support and structured error messages.
 */
async function casinoFetch<T>(
    url: string,
    options: RequestInit = {},
    extraHeaders: Record<string, string> = {}
): Promise<{ body: T; cookies: string; response: Response }> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...extraHeaders,
            ...(options.headers as Record<string, string> ?? {}),
        },
    });

    const cookies = extractCookies(response);
    const contentType = response.headers.get('content-type') ?? '';
    let body: T;

    if (contentType.includes('application/json')) {
        body = await response.json() as T;
    } else {
        body = { status: response.status, statusText: response.statusText } as unknown as T;
    }

    if (!response.ok && response.status >= 400) {
        const errText = typeof body === 'string' ? body : JSON.stringify(body);
        throw new Error(
            `Casino API ${options.method ?? 'GET'} ${url} → ${response.status} ${response.statusText}\n${errText}`
        );
    }

    return { body, cookies, response };
}

// ─── CSRF ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a CSRF token (required for all NextAuth mutating requests).
 *
 * GET https://casino.optikpi-hz.com/api/auth/csrf
 */
export async function getCsrfToken(): Promise<{ csrfToken: string; cookies: string }> {
    const response = await fetch(CASINO_ENDPOINTS.CSRF);
    const cookies  = extractCookies(response);

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`CSRF fetch failed: ${response.status} ${response.statusText}\n${text}`);
    }

    const data = (await response.json()) as CsrfResponse;
    if (!data?.csrfToken) throw new Error('CSRF token missing in response');

    return { csrfToken: data.csrfToken, cookies };
}

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Register a new casino user.
 *
 * POST https://casino.optikpi-hz.com/api/auth/register
 *
 * Example:
 *   await registerToCasino({
 *     firstName: 'Balakarthikeyan',
 *     lastName:  'G-Balakarthikeyan',
 *     country:   'India',
 *     email:     'karthi24102000@gmail.com',
 *     username:  'Balakarthikeyan',
 *     password:  'Test@123',
 *     phone:     '+919092444922',
 *     currency:  'USD',
 *     language:  'en',
 *   });
 */
export async function registerToCasino(
    payload: RegisterPayload
): Promise<RegisterResponse> {
    const { body } = await casinoFetch<RegisterResponse>(
        CASINO_ENDPOINTS.REGISTER,
        {
            method: 'POST',
            body: JSON.stringify(payload),
        }
    );
    return body;
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Log in using NextAuth credentials provider.
 * Automatically fetches a CSRF token beforehand (required by NextAuth).
 *
 * POST https://casino.optikpi-hz.com/api/auth/callback/credentials
 *
 * Returns the session cookies needed for all subsequent authenticated requests.
 *
 * Example:
 *   const session = await loginToCasino({ name: 'bala_demo', password: 'casino@optikpi' });
 *   console.log(session.cookies);
 */
export async function loginToCasino(
    credentials: Partial<LoginCredentials> = {},
    csrfToken?:  string,
    csrfCookies?: string
): Promise<LoginResult> {
    let token     = csrfToken;
    let cookieJar = csrfCookies ?? '';

    if (!token) {
        const csrf = await getCsrfToken();
        token      = csrf.csrfToken;
        cookieJar  = csrf.cookies;
    }

    const form = new URLSearchParams();
    form.append('name',        credentials.name     ?? DEFAULT_CREDENTIALS.name);
    form.append('password',    credentials.password ?? DEFAULT_CREDENTIALS.password);
    form.append('remember',    'true');
    form.append('redirect',    'false');
    form.append('csrfToken',   token);
    form.append('callbackUrl', CALLBACK_URL);
    form.append('json',        'true');

    const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (cookieJar) headers['Cookie'] = cookieJar;

    const response    = await fetch(CASINO_ENDPOINTS.LOGIN, {
        method:   'POST',
        headers,
        body:     form.toString(),
        redirect: 'manual',
    });

    const loginCookies = extractCookies(response);
    const allCookies   = [cookieJar, loginCookies].filter(Boolean).join('; ');

    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
        ? await response.json()
        : { status: response.status, statusText: response.statusText, url: response.url };

    return { body, cookies: allCookies };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * Sign out the current session from NextAuth.
 * Automatically fetches a CSRF token (required by NextAuth for signout).
 *
 * POST https://casino.optikpi-hz.com/api/auth/signout
 *
 * Example:
 *   await logoutFromCasino(session.cookies);
 */
export async function logoutFromCasino(
    sessionCookies: string,
    csrfToken?:     string
): Promise<LogoutResult> {
    let token = csrfToken;

    if (!token) {
        const csrf = await getCsrfToken();
        token = csrf.csrfToken;
    }

    const form = new URLSearchParams();
    form.append('csrfToken',   token);
    form.append('callbackUrl', CASINO_BASE_URL);
    form.append('json',        'true');

    const response = await fetch(CASINO_ENDPOINTS.LOGOUT, {
        method:   'POST',
        headers:  {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cookie':        sessionCookies,
        },
        body:     form.toString(),
        redirect: 'manual',
    });

    const contentType = response.headers.get('content-type') ?? '';
    const body = contentType.includes('application/json')
        ? await response.json()
        : { status: response.status, statusText: response.statusText };

    return {
        success: response.status < 400,
        body,
    };
}

// ─── Session ──────────────────────────────────────────────────────────────────

/**
 * Retrieve the current authenticated session user.
 *
 * GET https://casino.optikpi-hz.com/api/auth/session
 *
 * Example:
 *   const user = await getSession(session.cookies);
 *   console.log(user.balance);
 */
export async function getSession(
    cookies?: string
): Promise<SessionUser> {
    const headers: Record<string, string> = {};
    if (cookies) headers['Cookie'] = cookies;

    const { body } = await casinoFetch<SessionUser>(
        CASINO_ENDPOINTS.SESSION,
        { headers }
    );
    return body;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

/**
 * Create a transaction (deposit or withdrawal).
 *
 * POST https://casino.optikpi-hz.com/api/transaction/
 *
 * Example:
 *   await createTransaction({ actionType: 'DEPOSIT_PUBSUB_SUCCESS', amount: 100, type: 'deposit' }, cookies);
 */
export async function createTransaction(
    transaction: TransactionPayload,
    cookies?:    string
): Promise<TransactionResponse> {
    const headers: Record<string, string> = {};
    if (cookies) headers['Cookie'] = cookies;

    const { body } = await casinoFetch<TransactionResponse>(
        CASINO_ENDPOINTS.TRANSACTION,
        {
            method:  'POST',
            headers,
            body:    JSON.stringify(transaction),
        }
    );
    return body;
}

/**
 * Convenience: deposit a specific amount into the authenticated account.
 *
 * POST https://casino.optikpi-hz.com/api/transaction/
 *
 * Example:
 *   await deposit(100, session.cookies);
 */
export async function deposit(
    amount:   number,
    cookies?: string
): Promise<TransactionResponse> {
    return createTransaction(
        {
            actionType: 'DEPOSIT_PUBSUB_SUCCESS',
            amount,
            type: 'deposit',
        },
        cookies
    );
}

// ─── CasinoApi — Unified facade ───────────────────────────────────────────────

/**
 * Single import point for all Casino API operations.
 *
 * Usage in step / test code:
 *
 *   import { CasinoApi } from '../utils/casino-site-api';
 *
 *   // Register a new user
 *   await CasinoApi.register({
 *     firstName: 'Balakarthikeyan',
 *     lastName:  'G-Balakarthikeyan',
 *     country:   'India',
 *     email:     'karthi24102000@gmail.com',
 *     username:  'Balakarthikeyan',
 *     password:  'Test@123',
 *     phone:     '+919092444922',
 *     currency:  'USD',
 *     language:  'en',
 *   });
 *
 *   // Login
 *   const session = await CasinoApi.login({ name: 'Balakarthikeyan', password: 'Test@123' });
 *
 *   // Deposit
 *   await CasinoApi.deposit(100, session.cookies);
 *
 *   // Logout
 *   await CasinoApi.logout(session.cookies);
 */
export const CasinoApi = {
    /**
     * Register a new casino user.
     * POST /api/auth/register
     */
    register: (payload: RegisterPayload): Promise<RegisterResponse> =>
        registerToCasino(payload),

    /**
     * Log in and return session cookies.
     * POST /api/auth/callback/credentials  (NextAuth, CSRF-aware)
     */
    login: (credentials: Partial<LoginCredentials> = {}): Promise<LoginResult> =>
        loginToCasino(credentials),

    /**
     * Log out the current session.
     * POST /api/auth/signout  (NextAuth, CSRF-aware)
     */
    logout: (sessionCookies: string): Promise<LogoutResult> =>
        logoutFromCasino(sessionCookies),

    /**
     * Deposit an amount into the authenticated account.
     * POST /api/transaction/
     */
    deposit: (amount: number, sessionCookies: string): Promise<TransactionResponse> =>
        deposit(amount, sessionCookies),

    /**
     * Get the current authenticated session user details.
     * GET /api/auth/session
     */
    getSession: (sessionCookies: string): Promise<SessionUser> =>
        getSession(sessionCookies),

    /**
     * Fetch a raw CSRF token (rarely needed directly).
     * GET /api/auth/csrf
     */
    getCsrfToken: (): Promise<{ csrfToken: string; cookies: string }> =>
        getCsrfToken(),
} as const;
