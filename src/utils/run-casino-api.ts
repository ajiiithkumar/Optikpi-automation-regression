/**
 * Runner script to test Casino Site API functions.
 *
 * Usage:
 *   npx ts-node src/utils/run-casino-api.ts register   → Register a new user
 *   npx ts-node src/utils/run-casino-api.ts login      → Login only
 *   npx ts-node src/utils/run-casino-api.ts logout     → Login then logout
 *   npx ts-node src/utils/run-casino-api.ts deposit    → Login then deposit
 *   npx ts-node src/utils/run-casino-api.ts session    → Login then get session
 *   npx ts-node src/utils/run-casino-api.ts all        → All steps (default)
 */

import { CasinoApi, RegisterPayload } from './casino-site-api';

// ─── Sample registration payload ─────────────────────────────────────────────

const NEW_USER: RegisterPayload = {
    firstName: 'Balakarthikeyan',
    lastName:  'G-Balakarthikeyan',
    country:   'India',
    email:     'karthi24102000@gmail.com',
    username:  'Balakarthikeyan',
    password:  'Test@123',
    phone:     '+919092444922',
    currency:  'USD',
    language:  'en',
};

// ─── Shared: login flow ───────────────────────────────────────────────────────

async function doLogin(): Promise<string> {
    console.log('[1] Logging in...');
    const session = await CasinoApi.login({ name: NEW_USER.username, password: NEW_USER.password });
    console.log('  ✔ Login response:', JSON.stringify(session.body, null, 2));
    console.log(`  ✔ Cookies received: ${session.cookies ? 'Yes' : 'No'}\n`);
    return session.cookies;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function runRegister(): Promise<void> {
    console.log('=== Casino API: Register ===\n');
    console.log('[1] Registering new user...');
    console.log('  Payload:', JSON.stringify(NEW_USER, null, 2));
    const result = await CasinoApi.register(NEW_USER);
    console.log('  ✔ Registration response:', JSON.stringify(result, null, 2));
    console.log('\n=== Done ===');
}

async function runLogin(): Promise<void> {
    console.log('=== Casino API: Login ===\n');
    await doLogin();
    console.log('=== Done ===');
}

async function runLogout(): Promise<void> {
    console.log('=== Casino API: Login → Logout ===\n');
    const cookies = await doLogin();

    console.log('[2] Logging out...');
    const result = await CasinoApi.logout(cookies);
    console.log(`  ✔ Logout success: ${result.success}`);
    console.log('  ✔ Response:', JSON.stringify(result.body, null, 2));

    console.log('\n=== Done ===');
}

async function runDeposit(): Promise<void> {
    console.log('=== Casino API: Login → Deposit ===\n');
    const cookies = await doLogin();

    console.log('[2] Depositing 100...');
    const txn = await CasinoApi.deposit(100, cookies);
    console.log('  ✔ Transaction:', JSON.stringify(txn, null, 2));

    console.log('\n=== Done ===');
}

async function runSession(): Promise<void> {
    console.log('=== Casino API: Login → Session ===\n');
    const cookies = await doLogin();

    console.log('[2] Fetching session...');
    const user = await CasinoApi.getSession(cookies);
    console.log('  ✔ Session user:', JSON.stringify(user, null, 2));

    console.log('\n=== Done ===');
}

async function runAll(): Promise<void> {
    console.log('=== Casino API: Full Run ===\n');
    console.log('Endpoints:');
    const { CASINO_ENDPOINTS } = await import('./casino-site-api');
    Object.entries(CASINO_ENDPOINTS).forEach(([key, url]) => console.log(`  ${key}: ${url}`));
    console.log('');

    // 1. Register
    console.log('[1] Registering new user...');
    try {
        const reg = await CasinoApi.register(NEW_USER);
        console.log('  ✔ Registration:', JSON.stringify(reg, null, 2), '\n');
    } catch (err: any) {
        console.warn(`  ⚠ Registration skipped (may already exist): ${err.message}\n`);
    }

    // 2. Login
    const cookies = await doLogin();

    // 3. Session
    console.log('[3] Fetching session...');
    try {
        const user = await CasinoApi.getSession(cookies);
        console.log('  ✔ Session user:', JSON.stringify(user, null, 2), '\n');
    } catch (err: any) {
        console.error(`  ✖ Session failed: ${err.message}\n`);
    }

    // 4. Deposit
    console.log('[4] Depositing 100...');
    try {
        const txn = await CasinoApi.deposit(100, cookies);
        console.log('  ✔ Transaction:', JSON.stringify(txn, null, 2), '\n');
    } catch (err: any) {
        console.error(`  ✖ Deposit failed: ${err.message}\n`);
    }

    // 5. Logout
    console.log('[5] Logging out...');
    try {
        const result = await CasinoApi.logout(cookies);
        console.log(`  ✔ Logout success: ${result.success}\n`);
    } catch (err: any) {
        console.error(`  ✖ Logout failed: ${err.message}\n`);
    }

    console.log('=== Done ===');
}

// ─── CLI entry point ──────────────────────────────────────────────────────────

const COMMANDS: Record<string, () => Promise<void>> = {
    register: runRegister,
    login:    runLogin,
    logout:   runLogout,
    deposit:  runDeposit,
    session:  runSession,
    all:      runAll,
};

if (require.main === module) {
    const command = (process.argv[2] ?? 'all').toLowerCase();
    const fn = COMMANDS[command];

    if (!fn) {
        console.error(`Unknown command: "${command}"`);
        console.error(`Available: ${Object.keys(COMMANDS).join(', ')}`);
        process.exit(1);
    }

    fn().catch((err) => {
        console.error(`\n✖ Error: ${err.message}`);
        process.exit(1);
    });
}
