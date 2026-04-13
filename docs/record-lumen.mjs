/**
 * Lumen Dashboard — Demo Recording Script
 * Records a browser walkthrough with text overlays, then converts to GIF + MP4.
 */

import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.LUMEN_URL || 'http://localhost:3011';
const VIDEO_DIR = resolve(__dirname, 'recordings');
const OUTPUT_GIF = resolve(__dirname, 'lumen-demo.gif');
const OUTPUT_MP4 = resolve(__dirname, 'lumen-demo.mp4');

if (!existsSync(VIDEO_DIR)) mkdirSync(VIDEO_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function showOverlay(page, text) {
  await page.evaluate((t) => {
    let el = document.getElementById('demo-overlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-overlay';
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
    requestAnimationFrame(() => { el.style.opacity = '1'; });
  }, text);
}

async function hideOverlay(page) {
  await page.evaluate(() => {
    const el = document.getElementById('demo-overlay');
    if (el) el.style.opacity = '0';
  });
}

async function main() {
  console.log('🎬 Starting Lumen dashboard recording...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
    colorScheme: 'light',
  });

  const page = await context.newPage();

  try {
    // ──────────── Scene 1: Home / System Monitor ────────────
    console.log('  Scene 1: Home — System Monitor');
    await page.goto(BASE_URL);
    await sleep(2000);
    await showOverlay(page, 'Lumen — Real-time system monitoring');
    await sleep(3000);

    // ──────────── Scene 2: Agents ────────────
    console.log('  Scene 2: Agents');
    await hideOverlay(page);
    try {
      await page.click('a[href="/agents"]');
      await sleep(1500);
      await showOverlay(page, 'AI Agents — 8 specialized agents');
      await sleep(2500);
    } catch {
      console.log('    (Agents link not found)');
    }

    // ──────────── Scene 3: Chat ────────────
    console.log('  Scene 3: Chat');
    await hideOverlay(page);
    try {
      await page.click('a[href="/chat"]');
      await sleep(1500);
      await showOverlay(page, 'Chat — Talk with any agent');
      await sleep(2500);
    } catch {
      console.log('    (Chat link not found)');
    }

    // ──────────── Scene 4: Tasks ────────────
    console.log('  Scene 4: Tasks');
    await hideOverlay(page);
    try {
      await page.click('a[href="/tasks"]');
      await sleep(1500);
      await showOverlay(page, 'Tasks — Autopilot task management');
      await sleep(2500);
    } catch {
      console.log('    (Tasks link not found)');
    }

    // ──────────── Scene 5: Memory ────────────
    console.log('  Scene 5: Memory');
    await hideOverlay(page);
    try {
      await page.click('a[href="/memory"]');
      await sleep(1500);
      await showOverlay(page, 'Memory — Persistent knowledge graph');
      await sleep(2500);
    } catch {
      console.log('    (Memory link not found)');
    }

    // ──────────── Scene 6: Graph ────────────
    console.log('  Scene 6: Graph');
    await hideOverlay(page);
    try {
      await page.click('a[href="/graph"]');
      await sleep(1500);
      await showOverlay(page, 'Graph — Visual knowledge relationships');
      await sleep(2500);
    } catch {
      console.log('    (Graph link not found)');
    }

    // ──────────── Scene 7: Skills ────────────
    console.log('  Scene 7: Skills');
    await hideOverlay(page);
    try {
      await page.click('a[href="/skills"]');
      await sleep(1500);
      await showOverlay(page, 'Skills — Reusable agent capabilities');
      await sleep(2500);
    } catch {
      console.log('    (Skills link not found)');
    }

    // ──────────── Scene 8: Back to Home ────────────
    console.log('  Scene 8: Back to Home');
    await hideOverlay(page);
    try {
      await page.click('a[href="/"]');
    } catch {
      await page.goto(BASE_URL);
    }
    await sleep(1000);
    await showOverlay(page, 'Lumen — Your family AI operating system');
    await sleep(2500);
    await hideOverlay(page);
    await sleep(500);

  } catch (err) {
    console.error('Recording error:', err.message);
  }

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

  // Convert to MP4
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

  // Convert to GIF
  console.log('🔄 Converting to GIF...');
  const palettePath = resolve(VIDEO_DIR, 'palette-lumen.png');
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
