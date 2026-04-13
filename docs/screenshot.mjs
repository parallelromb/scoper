import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8005';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });

  // Login page
  await page.goto(BASE_URL);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/screenshots/01-login.png' });
  console.log('1. Login page captured');

  // Login
  await page.fill('#username', 'sri');
  await page.waitForTimeout(300);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/screenshots/02-home.png' });
  console.log('2. Home page captured');

  // Check what's in the nav
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a')).map(a => ({ href: a.getAttribute('href'), text: a.textContent?.trim() }))
  );
  console.log('Links on page:', JSON.stringify(links, null, 2));

  // Pipeline
  await page.click('a[href="/pipeline"]');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'docs/screenshots/03-pipeline.png' });
  console.log('3. Pipeline page captured');

  // Quick Estimate
  await page.click('a[href="/quick-estimate"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshots/04-quick-estimate.png' });
  console.log('4. Quick Estimate captured');

  // Dashboard
  await page.click('a[href="/dashboard"]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/screenshots/05-dashboard.png' });
  console.log('5. Dashboard captured');

  await browser.close();
  console.log('\nDone! Screenshots in docs/screenshots/');
}

main().catch(console.error);
