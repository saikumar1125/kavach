import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
const wav = path.resolve('scammer.wav');
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${wav}%noloop`, '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 1100 });
await page.evaluateOnNewDocument(() => {
  const A = window.Audio;
  window.Audio = function (src) { window.__wavSrc = src; window.__alertEpoch = Date.now(); return new A(src); };
});
page.on('console', m => m.type() === 'error' && console.log('PAGE ERR', m.text()));
await page.goto('http://localhost:3000');
const t0 = Date.now();
const rec = await page.screencast({ path: 'live-silent.mp4' });
await new Promise(r => setTimeout(r, 2000));
const clickEpoch = Date.now();
await page.click('#start');
await page.waitForFunction(() => window.__wavSrc, { timeout: 90000 });
const alertEpoch = await page.evaluate(() => window.__alertEpoch);
fs.writeFileSync('alert-live.wav', Buffer.from((await page.evaluate(() => window.__wavSrc)).split(',')[1], 'base64'));
// let the whole call play out
await new Promise(r => setTimeout(r, Math.max(0, clickEpoch + 33000 - Date.now())));
await page.click('#stop');
await page.waitForFunction(() => getComputedStyle(document.getElementById('reportCard')).display !== 'none', { timeout: 15000 });
await new Promise(r => setTimeout(r, 1500));
await page.evaluate(() => document.getElementById('reportCard').scrollIntoView());
await new Promise(r => setTimeout(r, 4000));
await rec.stop();
console.log(JSON.stringify({ clickAt: (clickEpoch - t0) / 1000, alertAt: (alertEpoch - t0) / 1000, total: (Date.now() - t0) / 1000 }));
console.log('transcript lines:', await page.evaluate(() => [...document.querySelectorAll('#feed .line')].map(d => d.firstChild.textContent)));
console.log('final score:', await page.evaluate(() => document.getElementById('score').textContent));
await browser.close();
