import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { execSync } from 'node:child_process';
const durs = [0,1,2,3,4,5].map(i => parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 explainer/n${i}.wav`).toString()));
const GAP = 0.7;
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.goto(pathToFileURL(path.resolve('explainer/index.html')).href);
const rec = await page.screencast({ path: 'explainer/silent.mp4' });
await new Promise(r => setTimeout(r, 500));
for (let i = 0; i < 6; i++) {
  await page.evaluate((n) => window.setStep(n), i - 1);
  await new Promise(r => setTimeout(r, (durs[i] + GAP) * 1000));
}
await rec.stop(); await browser.close();
console.log(durs.join(','));
