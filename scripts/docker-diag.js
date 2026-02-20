const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('=== Docker Browser Diagnostic v2 ===\n');

    // Read credentials from the CORRECT file (users-config/users.json)
    const usersConfig = JSON.parse(
        fs.readFileSync(path.join(process.cwd(), 'data', 'users-config', 'users.json'), 'utf8')
    );
    const user = usersConfig.users[0];
    console.log('Using credentials from: data/users-config/users.json');
    console.log('Username:', user.username);
    console.log('Password length:', user.password.length);

    const browser = await chromium.launch({
        headless: true,
        args: ['--window-size=1920,1080', '--disable-gpu', '--disable-software-rasterizer']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();
    console.log('\nViewport:', page.viewportSize());

    // Step 1: Navigate to login
    console.log('\n--- Step 1: Navigate to login page ---');
    await page.goto('https://demo.optikpi.com/en', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.log('URL:', page.url());

    const emailVisible = await page.locator("//input[@name='email']").first().isVisible().catch(() => false);
    console.log('Login form visible:', emailVisible);

    if (!emailVisible) {
        console.log('Login form not found — might already be logged in');
        await page.screenshot({ path: '/app/reports/diag-no-login-form.png' });
        await browser.close();
        return;
    }

    // Step 2: Login
    console.log('\n--- Step 2: Login ---');
    await page.locator("//input[@name='email']").first().fill(user.username);
    await page.locator("//input[@name='password']").first().fill(user.password);
    
    await page.screenshot({ path: '/app/reports/diag-before-submit.png' });
    console.log('Screenshot: diag-before-submit.png');

    // Click submit
    const submitBtn = page.locator("//button[@type='submit']").first();
    await submitBtn.waitFor({ state: 'attached', timeout: 10000 });
    await Promise.all([
        page.waitForLoadState('networkidle').catch(() => {}),
        submitBtn.click({ force: true })
    ]);
    
    // Wait for page to settle
    await page.waitForTimeout(10000);
    console.log('After login URL:', page.url());

    // Check for error message
    const errorMsg = await page.locator("text=Incorrect email or password").isVisible().catch(() => false);
    console.log('Login error visible:', errorMsg);

    await page.screenshot({ path: '/app/reports/diag-after-login.png' });
    console.log('Screenshot: diag-after-login.png');

    if (errorMsg) {
        console.log('\n❌ LOGIN FAILED - credentials rejected by server');
        console.log('This is why all tests fail in Docker.');
        await browser.close();
        return;
    }

    // Step 3: Check navigation
    console.log('\n--- Step 3: Check sidebar navigation ---');
    const navSelectors = {
        Dashboard: "//*[self::a or self::button][.//span[normalize-space()='Dashboard'] or normalize-space()='Dashboard']",
        Audience: "//*[self::a or self::button][.//span[normalize-space()='Audience'] or normalize-space()='Audience']",
        Campaign: "//*[self::a or self::button][.//span[normalize-space()='Campaign'] or normalize-space()='Campaign']",
        Workflow: "//*[self::a or self::button][.//span[normalize-space()='Workflow'] or normalize-space()='Workflow']",
        Settings: "//*[self::a or self::button][.//span[normalize-space()='Settings'] or normalize-space()='Settings']",
    };

    for (const [name, sel] of Object.entries(navSelectors)) {
        const count = await page.locator(sel).count();
        const visible = count > 0 ? await page.locator(sel).first().isVisible().catch(() => false) : false;
        console.log(`  ${name}: count=${count}, visible=${visible}`);
    }

    // Dump page HTML for sidebar
    const bodyHTML = await page.evaluate(() => {
        const nav = document.querySelector('nav') || document.querySelector('[class*="sidebar"]') || document.querySelector('[class*="nav"]');
        return nav ? nav.outerHTML.substring(0, 2000) : 'No nav/sidebar element found';
    });
    console.log('\n--- Sidebar HTML (first 2000 chars) ---');
    console.log(bodyHTML);

    // Page dimensions
    const dims = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
    }));
    console.log('\nWindow dimensions:', dims.innerWidth, 'x', dims.innerHeight);

    await browser.close();
    console.log('\n=== Diagnostic Complete ===');
})().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
