/**
 * Scoper — Demo Recording Script
 * Records a browser walkthrough as video with text overlays, then converts to GIF + MP4.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.SCOPER_URL || 'http://localhost:8005';
const VIDEO_DIR = resolve(__dirname, 'recordings');
const OUTPUT_GIF = resolve(__dirname, 'demo.gif');
const OUTPUT_MP4 = resolve(__dirname, 'demo.mp4');

if (!existsSync(VIDEO_DIR)) mkdirSync(VIDEO_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Inject or update a floating annotation overlay */
async function showOverlay(page, text) {
  await page.evaluate((t) => {
    let el = document.getElementById('scoper-demo-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'scoper-demo-overlay';
      Object.assign(el.style, {
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: '99999',
        background: 'rgba(0, 0, 0, 0.75)',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
        fontSize: '18px',
        fontWeight: '500',
        padding: '12px 28px',
        borderRadius: '12px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        transition: 'opacity 0.3s ease',
        opacity: '0',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      });
      document.body.appendChild(el);
    }
    el.textContent = t;
    // Fade in
    requestAnimationFrame(() => { el.style.opacity = '1'; });
  }, text);
}

async function hideOverlay(page) {
  await page.evaluate(() => {
    const el = document.getElementById('scoper-demo-overlay');
    if (el) el.style.opacity = '0';
  });
}

async function main() {
  console.log('🎬 Starting Scoper demo recording...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
    colorScheme: 'light',
  });

  const page = await context.newPage();

  try {
    // ──────────── Scene 1: Login ────────────
    console.log('  Scene 1: Login');
    await page.goto(BASE_URL);
    await sleep(1000);
    await showOverlay(page, 'Sign in to Scoper');
    await sleep(1500);

    // Type username with natural delay
    await page.fill('#username', '');
    await page.click('#username');
    await page.keyboard.type('sri', { delay: 150 });
    await sleep(600);

    await hideOverlay(page);
    await page.click('button[type="submit"]');
    await sleep(2500);

    // ──────────── Scene 2: Home Page ────────────
    console.log('  Scene 2: Home page');
    await showOverlay(page, 'Home — Choose your estimation workflow');
    await sleep(2500);
    await hideOverlay(page);

    // ──────────── Scene 3: Pipeline Builder ────────────
    console.log('  Scene 3: Pipeline Builder');
    await page.click('a[href="/pipeline"]');
    await sleep(1500);
    await showOverlay(page, 'Pipeline Builder — Drag-and-drop AI agents');
    await sleep(2500);

    // Apply Quick Estimate template
    console.log('  Scene 4: Apply template');
    try {
      await hideOverlay(page);
      const quickBtn = page.locator('button:has-text("Quick")').first();
      await quickBtn.waitFor({ timeout: 3000 });
      await quickBtn.click();
      await sleep(1000);
      await showOverlay(page, 'Apply a pre-built template');
      await sleep(2500);
    } catch {
      console.log('    (Quick template button not found)');
    }

    // Click on a node to show properties
    console.log('  Scene 5: Select a node');
    try {
      await hideOverlay(page);
      const node = page.locator('.react-flow__node').first();
      await node.waitFor({ timeout: 3000 });
      await node.click();
      await sleep(800);
      await showOverlay(page, 'Configure agent parameters');
      await sleep(2000);
    } catch {
      console.log('    (no nodes on canvas)');
    }

    // ──────────── Scene 6: Quick Estimate ────────────
    console.log('  Scene 6: Quick Estimate');
    await hideOverlay(page);
    await page.click('a[href="/quick-estimate"]');
    await sleep(1500);
    await showOverlay(page, 'Quick Estimate — Upload a document and go');
    await sleep(2500);

    // ──────────── Scene 7: Dashboard ────────────
    console.log('  Scene 7: Dashboard');
    await hideOverlay(page);
    await page.click('a[href="/dashboard"]');
    await sleep(1500);
    await showOverlay(page, 'Dashboard — KPIs, charts, and recent estimates');
    await sleep(2500);

    // Click Estimation tab
    try {
      await hideOverlay(page);
      const estTab = page.locator('button:has-text("Estimation")').first();
      await estTab.waitFor({ timeout: 2000 });
      await estTab.click();
      await sleep(800);
      await showOverlay(page, 'Estimation analytics and trends');
      await sleep(2000);
    } catch {
      console.log('    (Estimation tab not found)');
    }

    // Switch back to Command Center
    try {
      await hideOverlay(page);
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
      await sleep(1000);
      await showOverlay(page, 'Estimate detail — Phases, costs, and resources');
      await sleep(2500);
    } catch {
      console.log('    (no View link found)');
    }

    // ──────────── Scene 9: Back to Home ────────────
    console.log('  Scene 9: Home');
    await hideOverlay(page);
    await page.click('a[href="/"]');
    await sleep(1000);
    await showOverlay(page, 'Scoper — AI-powered estimation in minutes');
    await sleep(2000);
    await hideOverlay(page);
    await sleep(500);

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
