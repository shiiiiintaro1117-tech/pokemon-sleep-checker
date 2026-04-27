import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

// APIレスポンスをインターセプト
page.on('response', async (response) => {
  if (response.url().includes('/api/analyze')) {
    try {
      const json = await response.json();
      console.log('\n===== APIレスポンス =====');
      console.log('モデルが返した生データ (_debug.raw):');
      console.log(JSON.stringify(json._debug?.raw, null, 2));
      console.log('\n採用されたサブスキル (subskills):');
      console.log(JSON.stringify(json.subskills, null, 2));
      console.log('========================\n');
    } catch (e) {
      console.log('レスポンス解析エラー:', e.message);
    }
  }
});

await page.goto('https://pokemon-sleep-checker.vercel.app');
console.log('ブラウザを開きました。スクショをアップロードして採点してください。');
console.log('結果がここに表示されます。終了するにはCtrl+Cを押してください。');

// ブラウザを閉じないで待機
await new Promise(() => {});
