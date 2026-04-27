import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setViewportSize({ width: 1200, height: 630 });

const ogUrl = 'https://pokemon-sleep-checker.vercel.app/api/og?name=%E3%82%B5%E3%83%BC%E3%83%8A%E3%82%A4%E3%83%88&type=%E3%82%B9%E3%82%AD%E3%83%AB&score=85&grade=%E3%83%9E%E3%82%B9%E3%82%BF%E3%83%BC&nature=%E3%81%AA%E3%81%BE%E3%81%84%E3%81%8D&subskills=%E3%82%B9%E3%82%AD%E3%83%AB%E7%A2%BA%E7%8E%87%E3%82%A2%E3%83%83%E3%83%97M';

const res = await page.goto(ogUrl);
console.log('status:', res.status(), 'type:', res.headers()['content-type']);

// PNG画像として保存して確認
const buffer = await res.body();
await import('fs').then(fs => fs.promises.writeFile('C:/Users/shiii/pokemon-sleep-checker/og-preview.png', buffer));
console.log('og-preview.png に保存しました');

await browser.close();
