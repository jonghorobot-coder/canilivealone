/**
 * OG 이미지 생성 스크립트
 * 실행: node scripts/generate-og-image.js
 * 필요: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function generateOGImage() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 뷰포트 설정 (OG 이미지 크기)
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 2, // 고해상도
  });

  // HTML 파일 로드
  const htmlPath = path.join(__dirname, '..', 'og-image.html');
  await page.goto(`file://${htmlPath}`, {
    waitUntil: 'networkidle0',
  });

  // PNG로 저장
  const outputPath = path.join(__dirname, '..', 'public', 'og-image.png');
  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: {
      x: 0,
      y: 0,
      width: 1200,
      height: 630,
    },
  });

  await browser.close();
  console.log(`OG 이미지 생성 완료: ${outputPath}`);
}

generateOGImage().catch(console.error);
