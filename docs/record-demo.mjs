/**
 * ARIES v2.0 — Demo Recording Script
 * Records a browser walkthrough as video, then converts to GIF + MP4.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.ARIES_URL || 'http://localhost:8005';
const VIDEO_DIR = resolve(__dirname, 'recordings');
const OUTPUT_GIF = resolve(__dirname, 'demo.gif');
const OUTPUT_MP4 = resolve(__dirname, 'demo.mp4');

if (!existsSync(VIDEO_DIR)) mkdirSync(VIDEO_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  console.log('🎬 Starting ARIES demo recording...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
    colorScheme: 'dark',
  });

  const page = await context.newPage();

  try {
    // ──────────── Scene 1: Login ────────────
    console.log('  Scene 1: Login');
    await page.goto(BASE_URL);
    await sleep(1500);

    // Type username with natural delay
    await page.fill('#username', '');
    await page.click('#username');
    await page.keyboard.type('sri', { delay: 150 });
    await sleep(600);

    // Submit
    await page.click('button[type="submit"]');
    await sleep(2500);

    // ──────────── Scene 2: Home Page ────────────
    console.log('  Scene 2: Home page');
    await sleep(2000);

    // ──────────── Scene 3: Pipeline Builder ────────────
    console.log('  Scene 3: Pipeline Builder');
    await page.click('a[href="/pipeline"]');
    await sleep(2000);

    // Apply Quick Estimate template
    console.log('  Scene 4: Apply template');
    try {
      const quickBtn = page.locator('button:has-text("Quick")').first();
      await quickBtn.waitFor({ timeout: 3000 });
      await quickBtn.click();
      await sleep(2500);
    } catch {
      console.log('    (Quick template button not found)');
    }

    // Click on a node to show properties
    console.log('  Scene 5: Select a node');
    try {
      const node = page.locator('.react-flow__node').first();
      await node.waitFor({ timeout: 3000 });
      await node.click();
      await sleep(2000);
    } catch {
      console.log('    (no nodes on canvas)');
    }

    // ──────────── Scene 6: Quick Estimate ────────────
    console.log('  Scene 6: Quick Estimate');
    await page.click('a[href="/quick-estimate"]');
    await sleep(2500);

    // ──────────── Scene 7: Dashboard ────────────
    console.log('  Scene 7: Dashboard');
    await page.click('a[href="/dashboard"]');
    await sleep(2000);

    // Click Estimation tab
    try {
      const estTab = page.locator('button:has-text("Estimation")').first();
      await estTab.waitFor({ timeout: 2000 });
      await estTab.click();
      await sleep(1500);
    } catch {
      console.log('    (Estimation tab not found)');
    }

    // Switch back to Command Center
    try {
      const ccTab = page.locator('button:has-text("Command Center")').first();
      await ccTab.waitFor({ timeout: 2000 });
      await ccTab.click();
      await sleep(1500);
    } catch {}

    // ──────────── Scene 8: Estimate Detail ────────────
    console.log('  Scene 8: Estimate detail');
    try {
      const viewLink = page.locator('a:has-text("View")').first();
      await viewLink.waitFor({ timeout: 2000 });
      await viewLink.click();
      await sleep(2500);
    } catch {
      console.log('    (no View link found)');
    }

    // ──────────── Scene 9: Back to Home ────────────
    console.log('  Scene 9: Home');
    await page.click('a[href="/"]');
    await sleep(1500);

  } catch (err) {
    console.error('Recording error:', err.message);
  }

  // Close and save video
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const videoPath = await video?.path();
  if (!videoPath) {
    console.error('No video recorded');
    process.exit(1);
  }

  console.log(`\n📹 Video saved: ${videoPath}`);

  // ──────────── Convert to MP4 ────────────
  console.log('🔄 Converting to MP4...');
  try {
    execSync(
      `ffmpeg -y -i "${videoPath}" -vf "fps=24,scale=1280:-2" -c:v libx264 -preset slow -crf 22 -an "${OUTPUT_MP4}"`,
      { stdio: 'pipe' }
    );
    const mp4Size = (statSync(OUTPUT_MP4).size / 1024 / 1024).toFixed(1);
    console.log(`✅ MP4: ${OUTPUT_MP4} (${mp4Size} MB)`);
  } catch (e) {
    console.error('MP4 conversion failed:', e.stderr?.toString().slice(-200));
  }

  // ──────────── Convert to GIF ────────────
  console.log('🔄 Converting to GIF...');
  const palettePath = resolve(VIDEO_DIR, 'palette.png');
  try {
    execSync(
      `ffmpeg -y -i "${videoPath}" -vf "fps=12,scale=800:-1:flags=lanczos,palettegen=max_colors=128" "${palettePath}"`,
      { stdio: 'pipe' }
    );
    execSync(
      `ffmpeg -y -i "${videoPath}" -i "${palettePath}" -lavfi "fps=12,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" "${OUTPUT_GIF}"`,
      { stdio: 'pipe' }
    );
    execSync(
      `gifsicle -O3 --lossy=80 "${OUTPUT_GIF}" -o "${OUTPUT_GIF}"`,
      { stdio: 'pipe' }
    );
    const gifSize = (statSync(OUTPUT_GIF).size / 1024 / 1024).toFixed(1);
    console.log(`✅ GIF: ${OUTPUT_GIF} (${gifSize} MB)`);
  } catch (e) {
    console.error('GIF conversion failed:', e.stderr?.toString().slice(-200));
  }

  console.log('\n🎬 Done!');
  console.log(`  MP4: ${OUTPUT_MP4}`);
  console.log(`  GIF: ${OUTPUT_GIF}`);
}

main().catch(console.error);
