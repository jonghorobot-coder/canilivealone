/**
 * 프리미엄 리포트 HTML 템플릿 v2
 * - 페이지 하단 푸터 고정
 * - 일관된 레이아웃
 * - 개선된 가독성
 */

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatMonth(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function getScoreColor(score) {
  if (score >= 70) return '#0F3D2E';
  if (score >= 55) return '#C58A00';
  return '#B42318';
}

export function generateReportHTML(data) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>독립점수 - 점수 상승 설계 리포트</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
      color: #1a1a1a;
      line-height: 1.5;
      background: #f5f5f5;
      font-size: 12px;
    }

    .page {
      width: 210mm;
      height: 297mm;
      padding: 10mm 12mm;
      margin: 5mm auto;
      background: #fff;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
      page-break-after: always;
      page-break-inside: avoid;
    }

    .page:last-child {
      page-break-after: auto;
    }

    .page-content {
      height: calc(297mm - 20mm - 15mm);
      overflow: hidden;
    }

    /* 헤더 */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 2px solid #0F3D2E;
      margin-bottom: 15px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      width: 24px;
      height: 24px;
      background: #0F3D2E;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-text {
      font-size: 14px;
      font-weight: 700;
      color: #0F3D2E;
    }

    .page-info {
      font-size: 10px;
      color: #999;
    }

    /* 푸터 - 페이지 하단 고정 */
    .footer {
      position: absolute;
      bottom: 8mm;
      left: 12mm;
      right: 12mm;
      padding-top: 8px;
      border-top: 1px solid #e5e5e5;
      font-size: 9px;
      color: #888;
      text-align: center;
    }

    /* 백분위 게이지 바 */
    .percentile-gauge {
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.1);
      border-radius: 6px;
    }

    .percentile-gauge-label {
      font-size: 9px;
      opacity: 0.8;
      margin-bottom: 4px;
    }

    .percentile-gauge-bar {
      height: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      position: relative;
      overflow: hidden;
    }

    .percentile-gauge-fill {
      height: 100%;
      background: linear-gradient(90deg, #ef4444, #fbbf24, #22c55e);
      border-radius: 4px;
    }

    .percentile-gauge-marker {
      position: absolute;
      top: -2px;
      width: 4px;
      height: 12px;
      background: white;
      border-radius: 2px;
      transform: translateX(-50%);
    }

    .percentile-gauge-text {
      font-size: 10px;
      font-weight: 600;
      margin-top: 4px;
      display: flex;
      justify-content: space-between;
    }

    /* 큰 숫자 강조 */
    .big-number {
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
    }

    .big-number.danger { color: #dc2626; }
    .big-number.success { color: #16a34a; }

    /* 제목 스타일 */
    h1 {
      font-size: 20px;
      font-weight: 700;
      color: #0F3D2E;
      margin-bottom: 5px;
    }

    h2 {
      font-size: 14px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 15px 0 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #eee;
    }

    h3 {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 12px;
      color: #666;
      margin-bottom: 15px;
    }

    /* 점수 카드 */
    .score-card {
      background: linear-gradient(135deg, #0F3D2E 0%, #1a5c45 100%);
      border-radius: 12px;
      padding: 20px;
      color: white;
      margin-bottom: 15px;
    }

    .score-main {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .score-number {
      font-size: 48px;
      font-weight: 800;
      line-height: 1;
    }

    .score-info {
      flex: 1;
    }

    .score-grade {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .score-comparison {
      font-size: 11px;
      opacity: 0.9;
    }

    .percentile-badge {
      display: inline-block;
      background: rgba(255,255,255,0.15);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      margin-top: 5px;
    }

    /* 비교 박스 */
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }

    .comparison-item {
      padding: 15px;
      border-radius: 10px;
      text-align: center;
    }

    .comparison-item.danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .comparison-item.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }

    .comparison-label {
      font-size: 10px;
      color: #666;
      margin-bottom: 5px;
    }

    .comparison-bar {
      height: 6px;
      background: #e5e5e5;
      border-radius: 3px;
      margin: 8px 0;
      overflow: hidden;
    }

    .comparison-bar-fill {
      height: 100%;
      border-radius: 3px;
    }

    .comparison-bar-fill.danger { background: #ef4444; }
    .comparison-bar-fill.success { background: #22c55e; }

    .comparison-value {
      font-size: 18px;
      font-weight: 700;
    }

    .comparison-value.danger { color: #dc2626; }
    .comparison-value.success { color: #16a34a; }

    .comparison-desc {
      font-size: 10px;
      color: #666;
      margin-top: 3px;
    }

    .basis-text {
      font-size: 9px;
      color: #888;
      font-style: italic;
      margin-top: 4px;
    }

    .comparison-prob {
      font-size: 12px;
      font-weight: 600;
      margin-top: 8px;
    }

    /* 경고 박스 */
    .warning-box {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 15px;
      font-size: 12px;
      color: #92400e;
    }

    .warning-box strong { color: #78350f; }

    /* 최적 조합 */
    .optimal-box {
      background: #f0fdf4;
      border: 2px solid #22c55e;
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 15px;
    }

    .optimal-title {
      font-size: 14px;
      font-weight: 700;
      color: #166534;
      margin-bottom: 10px;
    }

    .optimal-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #bbf7d0;
      font-size: 12px;
    }

    .optimal-item:last-of-type { border-bottom: none; }

    .optimal-item-value {
      font-weight: 600;
      color: #166534;
    }

    .optimal-total {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #22c55e;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      font-weight: 600;
    }

    .optimal-total-value {
      font-size: 14px;
      font-weight: 700;
      color: #166534;
    }

    /* 점수 변화 시각화 */
    .score-change {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 10px;
      margin: 15px 0;
    }

    .score-change-item {
      text-align: center;
    }

    .score-change-label {
      font-size: 10px;
      color: #666;
    }

    .score-change-value {
      font-size: 24px;
      font-weight: 700;
    }

    .score-change-grade {
      font-size: 10px;
    }

    .score-change-arrow {
      font-size: 20px;
      color: #ccc;
    }

    /* 테이블 */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 15px;
    }

    th, td {
      padding: 8px 6px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    th {
      background: #f8f9fa;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
    }

    td.number { text-align: right; font-variant-numeric: tabular-nums; }
    td.positive { color: #16a34a; font-weight: 600; }
    td.negative { color: #dc2626; font-weight: 600; }

    tfoot tr {
      background: #f0fdf4;
      font-weight: 600;
    }

    /* 카테고리 카드 */
    .category-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .category-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 10px;
      font-size: 11px;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .category-name { font-weight: 600; }

    .category-score { font-weight: 700; }

    .category-bar {
      height: 4px;
      background: #e5e5e5;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 6px;
    }

    .category-bar-fill {
      height: 100%;
      border-radius: 2px;
    }

    .category-details {
      font-size: 9px;
      color: #666;
      margin-bottom: 4px;
    }

    .category-status {
      font-size: 9px;
      padding: 3px 6px;
      border-radius: 4px;
      display: inline-block;
    }

    .category-status.warning {
      background: #fef3c7;
      color: #92400e;
    }

    .category-status.good {
      background: #f0fdf4;
      color: #166534;
    }

    /* 로드맵 */
    .roadmap-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .roadmap-item {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 10px;
      font-size: 11px;
    }

    .roadmap-month {
      display: inline-block;
      width: 24px;
      height: 24px;
      background: #0F3D2E;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      font-weight: 700;
      font-size: 10px;
      margin-bottom: 6px;
    }

    .roadmap-title {
      font-weight: 600;
      margin-bottom: 6px;
    }

    .roadmap-tasks {
      list-style: none;
      font-size: 10px;
      color: #666;
    }

    .roadmap-tasks li {
      padding: 2px 0 2px 12px;
      position: relative;
    }

    .roadmap-tasks li::before {
      content: "☐";
      position: absolute;
      left: 0;
      font-size: 9px;
    }

    .roadmap-score {
      font-size: 9px;
      color: #16a34a;
      font-weight: 600;
      margin-top: 6px;
    }

    .roadmap-milestone {
      background: #fef3c7;
      color: #92400e;
      font-size: 9px;
      padding: 3px 6px;
      border-radius: 3px;
      margin-top: 4px;
      display: inline-block;
      font-weight: 600;
    }

    /* 시뮬레이션 */
    .simulation-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }

    .simulation-box {
      border-radius: 8px;
      padding: 12px;
      font-size: 11px;
    }

    .simulation-box.danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
    }

    .simulation-box.success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }

    .simulation-title {
      font-weight: 600;
      margin-bottom: 8px;
    }

    .simulation-stat {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }

    .simulation-prob {
      font-size: 12px;
      font-weight: 700;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(0,0,0,0.1);
    }

    .simulation-prob.danger { color: #dc2626; }
    .simulation-prob.success { color: #16a34a; }

    .optimal-date-box {
      background: #0F3D2E;
      color: white;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }

    .optimal-date-label {
      font-size: 10px;
      opacity: 0.8;
    }

    .optimal-date-value {
      font-size: 18px;
      font-weight: 700;
      margin: 5px 0;
    }

    .optimal-date-sub {
      font-size: 9px;
      opacity: 0.7;
    }

    /* 비상금 */
    .emergency-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }

    .emergency-stat {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }

    .emergency-stat-label {
      font-size: 9px;
      color: #666;
      margin-bottom: 3px;
    }

    .emergency-stat-value {
      font-size: 14px;
      font-weight: 700;
    }

    .emergency-stat-value.danger { color: #dc2626; }

    .emergency-bar-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 11px;
    }

    .emergency-bar-label {
      width: 65px;
    }

    .emergency-bar-bg {
      flex: 1;
      height: 16px;
      background: #e5e5e5;
      border-radius: 4px;
      overflow: hidden;
    }

    .emergency-bar-fill {
      height: 100%;
      background: #0F3D2E;
      border-radius: 4px;
    }

    .emergency-bar-months {
      width: 55px;
      text-align: right;
      font-weight: 600;
    }

    .emergency-bar-months.recommended {
      color: #16a34a;
    }

    /* 체크리스트 */
    .checklist-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .checklist-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 10px;
    }

    .checklist-title {
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 8px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e5e5e5;
    }

    .checklist {
      list-style: none;
      font-size: 11px;
    }

    .checklist li {
      padding: 5px 0 5px 20px;
      position: relative;
      border-bottom: 1px solid #eee;
    }

    .checklist li:last-child { border-bottom: none; }

    .checklist li::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      border: 1.5px solid #ccc;
      border-radius: 3px;
    }

    /* 인포 박스 */
    .info-box {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      font-size: 12px;
      margin: 10px 0;
    }

    .info-box.highlight {
      background: #f0fdf4;
      color: #166534;
    }

    /* 인쇄 스타일 */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      html, body {
        width: 210mm;
        margin: 0;
        padding: 0;
        background: white;
      }

      .page {
        width: 210mm;
        height: 297mm;
        margin: 0;
        padding: 10mm 12mm;
        box-shadow: none;
        page-break-after: always;
      }

      .page:last-child {
        page-break-after: auto;
      }

      .footer {
        bottom: 8mm;
      }
    }

    @page {
      size: A4;
      margin: 0;
    }
  </style>
</head>
<body>

<!-- 페이지 1: 충격 비교 (Hook) -->
<div class="page">
  <div class="page-content">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="14" height="14" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
            <path d="M20 50L50 65L80 50" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>
          </svg>
        </div>
        <span class="logo-text">독립점수</span>
      </div>
      <span class="page-info">점수 상승 설계 리포트 · 1/6</span>
    </div>

    <h1>점수 상승 설계 리포트</h1>
    <p class="subtitle">
      ${data.userName ? `<strong>${data.userName}</strong> 님을 위한 맞춤 분석 · ` : ''}${formatDate(data.generatedAt)} 생성
    </p>

    <div class="score-card">
      <div class="score-main">
        <div class="score-number">${data.score}</div>
        <div class="score-info">
          <div class="score-grade">${data.gradeEmoji} ${data.grade}</div>
          <div class="score-comparison">같은 소득대 평균: ${data.averageScore}점</div>
        </div>
      </div>
      <div class="percentile-gauge">
        <div class="percentile-gauge-label">전체 사용자 중 위치</div>
        <div class="percentile-gauge-bar">
          <div class="percentile-gauge-fill"></div>
          <div class="percentile-gauge-marker" style="left: ${data.percentile}%"></div>
        </div>
        <div class="percentile-gauge-text">
          <span>하위</span>
          <span style="color: ${data.isAboveAverage ? '#22c55e' : '#fbbf24'}; font-weight: 700;">
            ${data.isAboveAverage ? '상위' : '하위'} ${data.isAboveAverage ? 100 - data.percentile : data.percentile}%
          </span>
          <span>상위</span>
        </div>
      </div>
    </div>

    <h2>🕐 독립 준비 시간 비교</h2>
    <div class="comparison-grid">
      <div class="comparison-item danger">
        <div class="comparison-label">지금 독립하면</div>
        <div class="comparison-bar">
          <div class="comparison-bar-fill danger" style="width: 100%"></div>
        </div>
        <div class="comparison-value danger">${data.independence.scenarioA.monthsToStability}개월</div>
        <div class="comparison-desc">"안정" 등급까지 소요</div>
        <div class="comparison-prob danger">⚠️ 재정 압박 확률 ${data.independence.scenarioA.riskProbability}%</div>
        <div class="basis-text">현재 수지 구조 기반 추정</div>
      </div>
      <div class="comparison-item success">
        <div class="comparison-label">${data.independence.monthsToReady}개월 준비 후</div>
        <div class="comparison-bar">
          <div class="comparison-bar-fill success" style="width: ${Math.round(data.independence.scenarioB.monthsToStability / Math.max(data.independence.scenarioA.monthsToStability, 1) * 100)}%"></div>
        </div>
        <div class="comparison-value success">${data.independence.scenarioB.monthsToStability}개월</div>
        <div class="comparison-desc">"안정" 등급까지 소요</div>
        <div class="comparison-prob success">✅ 안정 유지 확률 ${data.independence.scenarioB.successProbability}%</div>
        <div class="basis-text">절감 계획 실행 시 추정</div>
      </div>
    </div>

    <div class="warning-box" style="padding: 15px;">
      <strong style="font-size: 12px;">⚠️ 현재 소비 구조 유지 시 누적 손실</strong>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; text-align: center;">
        <div>
          <div style="font-size: 10px; color: #92400e;">3년</div>
          <div class="big-number danger">${data.cumulativeLoss.threeYear.toLocaleString()}</div>
          <div style="font-size: 10px; color: #92400e;">만원</div>
        </div>
        <div>
          <div style="font-size: 10px; color: #92400e;">5년</div>
          <div class="big-number danger">${data.cumulativeLoss.fiveYear.toLocaleString()}</div>
          <div style="font-size: 10px; color: #92400e;">만원</div>
        </div>
        <div>
          <div style="font-size: 10px; color: #92400e;">30세까지</div>
          <div class="big-number danger">${data.cumulativeLoss.toAge30.toLocaleString()}</div>
          <div style="font-size: 10px; color: #92400e;">만원</div>
        </div>
      </div>
      <div style="font-size: 9px; color: #92400e; margin-top: 8px; text-align: center;">
        * 현재 저축 부족분 월 ${data.cumulativeLoss.monthly}만원 기준 계산
      </div>
    </div>

    <div class="info-box highlight">
      💡 이 리포트의 플랜을 따르면 <strong>${data.independence.monthsSaved > 0 ? data.independence.monthsSaved + '개월 단축' : '즉시 안정 가능'}</strong> + <strong>연 ${Math.round(data.cumulativeLoss.yearly * 0.7).toLocaleString()}만원 절약</strong> 가능
    </div>
  </div>
  <div class="footer">독립점수 · canilivealone.help@gmail.com</div>
</div>

<!-- 페이지 2: 최적 조합 -->
<div class="page">
  <div class="page-content">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="14" height="14" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
            <path d="M20 50L50 65L80 50" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>
          </svg>
        </div>
        <span class="logo-text">독립점수</span>
      </div>
      <span class="page-info">점수 상승 설계 리포트 · 2/6</span>
    </div>

    <h2>🎯 가장 효율적인 +${data.optimalAdjustments.totalScoreDiff}점 조합</h2>

    <div class="optimal-box">
      ${data.optimalAdjustments.adjustments.map(adj => `
        <div class="optimal-item">
          <span>${adj.label} ${adj.type === 'reduce' ? adj.amount + '만원 절감' : adj.amount + '만원 증가'}</span>
          <span class="optimal-item-value">+${adj.scoreDiff}점 (${adj.efficiency.toFixed(1)}점/만원)</span>
        </div>
      `).join('')}
      <div class="optimal-total">
        <span>총 ${data.optimalAdjustments.totalAdjustment}만원 조정</span>
        <span class="optimal-total-value">+${data.optimalAdjustments.totalScoreDiff}점</span>
      </div>
      <div style="font-size: 9px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #bbf7d0;">
        효율 = 점수 상승 ÷ 조정 금액 (높을수록 적은 노력으로 큰 효과)
      </div>
    </div>

    <div class="info-box">
      <strong>💡 이 조합이 최적인 이유</strong><br>
      생활 변화 최소 · 효율(점수/만원) 최대 · <strong style="color: #166534;">실현 가능성 ${data.optimalAdjustments.feasibilityRate}%</strong>
      <div style="font-size: 9px; color: #888; margin-top: 4px;">
        * 실현 가능성 = 조정 금액이 소득의 ${Math.round(data.optimalAdjustments.totalAdjustment / data.income * 100)}%로 부담이 적음
      </div>
    </div>

    <h2>📈 예상 점수 변화</h2>
    <div class="score-change">
      <div class="score-change-item">
        <div class="score-change-label">현재</div>
        <div class="score-change-value" style="color: #666;">${data.score}점</div>
        <div class="score-change-grade" style="color: #666;">${data.grade}</div>
      </div>
      <div class="score-change-arrow">→</div>
      <div class="score-change-item">
        <div class="score-change-label">1개월 후</div>
        <div class="score-change-value" style="color: #C58A00;">${Math.min(data.score + 5, 100)}점</div>
        <div class="score-change-grade" style="color: #C58A00;">+5점</div>
      </div>
      <div class="score-change-arrow">→</div>
      <div class="score-change-item">
        <div class="score-change-label">3개월 후</div>
        <div class="score-change-value" style="color: #16a34a;">${data.projectedScore}점</div>
        <div class="score-change-grade" style="color: #16a34a;">${data.projectedGrade}</div>
      </div>
    </div>

    <div class="info-box highlight">
      📊 예상 점수 상승: <strong>+${data.optimalAdjustments.totalScoreDiff}점</strong> (${data.score}점 → ${data.projectedScore}점)
    </div>

    <h2>💰 월간 절감 효과</h2>
    <table>
      <thead>
        <tr>
          <th>항목</th>
          <th style="text-align:right;">월</th>
          <th style="text-align:right;">연간</th>
          <th style="text-align:right;">3년</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>예상 절감액</td>
          <td class="number positive">+${data.optimalAdjustments.totalAdjustment}만원</td>
          <td class="number positive">+${data.optimalAdjustments.totalAdjustment * 12}만원</td>
          <td class="number positive">+${data.optimalAdjustments.totalAdjustment * 36}만원</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="footer">독립점수 · canilivealone.help@gmail.com</div>
</div>

<!-- 페이지 3: 카테고리 분석 + 예산표 (통합) -->
<div class="page">
  <div class="page-content">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="14" height="14" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
            <path d="M20 50L50 65L80 50" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>
          </svg>
        </div>
        <span class="logo-text">독립점수</span>
      </div>
      <span class="page-info">점수 상승 설계 리포트 · 3/6</span>
    </div>

    <h2>📊 카테고리별 분석</h2>
    <div class="category-grid" style="grid-template-columns: repeat(3, 1fr); gap: 8px;">
      ${data.categoryDetails.map(cat => `
        <div class="category-card" style="padding: 8px; ${cat.isOverBudget ? 'border: 2px solid #fcd34d; background: #fffbeb;' : 'opacity: 0.8;'}">
          <div class="category-header" style="margin-bottom: 4px;">
            <span class="category-name" style="font-size: 10px; ${cat.isOverBudget ? 'font-weight: 700;' : ''}">${cat.label}</span>
            <span class="category-score" style="color: ${getScoreColor(cat.score)}; font-size: 11px; font-weight: 700;">${cat.score}점</span>
          </div>
          <div class="category-bar" style="margin-bottom: 4px;">
            <div class="category-bar-fill" style="width: ${cat.score}%; background: ${getScoreColor(cat.score)}"></div>
          </div>
          <div class="category-details" style="font-size: 9px; margin-bottom: 2px;">
            ${cat.expense}만 (${cat.currentRatio}%) · 권장 ${cat.recommendedRatio}%
          </div>
          ${cat.isOverBudget
            ? `<span class="category-status warning" style="font-size: 9px; padding: 2px 6px;">${cat.category === 'savings' ? '⚠️ 부족' : '⚠️ 초과'} ${cat.gap}%p</span>`
            : `<span class="category-status good" style="font-size: 9px; padding: 2px 6px;">✓ 적정</span>`
          }
        </div>
      `).join('')}
    </div>

    <h2>📋 맞춤 예산표</h2>
    <table>
      <thead>
        <tr>
          <th>카테고리</th>
          <th style="text-align:right;">현재</th>
          <th style="text-align:right;">권장</th>
          <th style="text-align:right;">조정</th>
          <th style="text-align:right;">효과</th>
        </tr>
      </thead>
      <tbody>
        ${data.budgetTable.map(row => `
          <tr>
            <td>${row.label}</td>
            <td class="number">${row.current}만</td>
            <td class="number">${row.recommended}만</td>
            <td class="number ${row.change > 0 ? 'positive' : row.change < 0 ? 'negative' : ''}">
              ${row.change !== 0 ? (row.change > 0 ? '+' : '') + row.change + '만' : '-'}
            </td>
            <td class="number ${row.scoreDiff > 0 ? 'positive' : ''}">
              ${row.scoreDiff > 0 ? '+' + row.scoreDiff + '점' : '-'}
            </td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3"><strong>합계</strong></td>
          <td class="number"><strong>${data.optimalAdjustments.totalAdjustment}만</strong></td>
          <td class="number positive"><strong>+${data.optimalAdjustments.totalScoreDiff}점</strong></td>
        </tr>
      </tfoot>
    </table>

    <h2>🔍 핵심 개선 영역 <span style="font-size: 10px; font-weight: 400; color: #666;">(개선 필요도 높은 순)</span></h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      ${data.categoryDetails.filter(c => c.isOverBudget).slice(0, 2).map(cat => `
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 10px; font-size: 10px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 11px;">${cat.label}</strong>
            <span style="color: ${getScoreColor(cat.score)}; font-weight: 700;">${cat.score}점</span>
          </div>
          <div style="color: #dc2626; margin-bottom: 6px; font-weight: 600;">
            ❌ ${cat.category === 'savings' ? '권장 대비 ' + cat.gap + '%p 부족' : '권장 대비 ' + cat.gap + '%p 초과'}
            ${cat.yearlyLoss > 0 ? `<br><span style="font-size: 9px;">연간 손실: ${cat.yearlyLoss}만원 (${cat.gap}%p × 12개월)</span>` : ''}
          </div>
          <div style="color: #333;">
            ${cat.suggestions.slice(0, 2).map(s => `→ ${s}`).join('<br>')}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="info-box" style="margin-top: 10px;">
      📈 <strong>${data.score}점 → ${data.projectedScore}점</strong> · ${data.grade} → ${data.projectedGrade}
    </div>
  </div>
  <div class="footer">독립점수 · canilivealone.help@gmail.com</div>
</div>

<!-- 페이지 4: 6개월 로드맵 -->
<div class="page">
  <div class="page-content">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="14" height="14" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
            <path d="M20 50L50 65L80 50" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>
          </svg>
        </div>
        <span class="logo-text">독립점수</span>
      </div>
      <span class="page-info">점수 상승 설계 리포트 · 4/6</span>
    </div>

    <h2>📅 6개월 실행 로드맵</h2>

    <div class="roadmap-grid">
      ${data.roadmap.slice(0, 3).map(item => `
        <div class="roadmap-item" style="${item.milestone ? 'border: 2px solid #22c55e;' : ''}">
          <div class="roadmap-month">${item.month}</div>
          <div class="roadmap-title">${item.title}</div>
          <ul class="roadmap-tasks">
            ${item.tasks.map(task => `<li>${task}</li>`).join('')}
          </ul>
          <div class="roadmap-score">→ ${item.expectedScore}점 (+${item.scoreDiff})</div>
          ${item.milestone ? `<div class="roadmap-milestone">🎉 ${item.milestone}</div>` : ''}
        </div>
      `).join('')}
    </div>

    <div style="margin-top: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
      <div style="font-size: 11px; font-weight: 600; margin-bottom: 8px; color: #666;">4-6개월: 유지 및 점검</div>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
        ${data.roadmap.slice(3, 6).map(item => `
          <div style="text-align: center; padding: 8px; background: white; border-radius: 6px;">
            <div style="font-size: 12px; font-weight: 700; color: #0F3D2E;">${item.month}개월</div>
            <div style="font-size: 10px; color: #666; margin: 4px 0;">${item.title}</div>
            <div style="font-size: 11px; font-weight: 600; color: #16a34a;">${item.expectedScore}점</div>
            ${item.milestone ? `<div style="font-size: 9px; color: #92400e; margin-top: 4px;">🎉 ${item.milestone}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="info-box highlight" style="margin-top: 12px;">
      📊 총 점수 상승: <strong>+${data.optimalAdjustments.totalScoreDiff}점</strong> (${data.score}점 → ${data.projectedScore}점)
    </div>
  </div>
  <div class="footer">독립점수 · canilivealone.help@gmail.com</div>
</div>

<!-- 페이지 5: 독립 시뮬레이션 -->
<div class="page">
  <div class="page-content">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="14" height="14" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
            <path d="M20 50L50 65L80 50" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>
          </svg>
        </div>
        <span class="logo-text">독립점수</span>
      </div>
      <span class="page-info">점수 상승 설계 리포트 · 5/6</span>
    </div>

    <h2>🏠 독립 시뮬레이션</h2>

    <div class="simulation-grid">
      <div class="simulation-box danger">
        <div class="simulation-title">A. 지금 바로 독립하면</div>
        <div class="simulation-stat">
          <span>월 수지</span>
          <span style="font-weight:600; color: ${data.independence.scenarioA.monthlySurplus >= 0 ? '#16a34a' : '#dc2626'}">
            ${data.independence.scenarioA.monthlySurplus >= 0 ? '+' : ''}${data.independence.scenarioA.monthlySurplus}만원
          </span>
        </div>
        <div class="simulation-stat">
          <span>6개월 후 비상금</span>
          <span>${Math.max(0, data.independence.scenarioA.sixMonthFund)}만원</span>
        </div>
        <div class="simulation-prob danger">
          ⚠️ 재정 압박 확률 ${data.independence.scenarioA.riskProbability}%
        </div>
        <div style="font-size: 9px; color: #888; margin-top: 4px; font-style: italic;">
          비상금 대비 월 적자 구조 기반
        </div>
      </div>

      <div class="simulation-box success">
        <div class="simulation-title">B. 3개월 준비 후 독립하면</div>
        <div class="simulation-stat">
          <span>월 수지</span>
          <span style="font-weight:600; color: ${data.independence.scenarioB.monthlySurplus >= 0 ? '#16a34a' : '#dc2626'}">
            ${data.independence.scenarioB.monthlySurplus >= 0 ? '+' : ''}${data.independence.scenarioB.monthlySurplus}만원
          </span>
        </div>
        <div class="simulation-stat">
          <span>6개월 후 비상금</span>
          <span>${Math.max(0, data.independence.scenarioB.sixMonthFund)}만원</span>
        </div>
        <div class="simulation-prob success">
          ✅ 안정 유지 확률 ${data.independence.scenarioB.successProbability}%
        </div>
        <div style="font-size: 9px; color: #888; margin-top: 4px; font-style: italic;">
          절감 계획 + 비상금 확보 시
        </div>
      </div>
    </div>

    <div class="optimal-date-box">
      <div class="optimal-date-label">🎯 최적 독립 시점</div>
      <div class="optimal-date-value">${formatMonth(data.independence.optimalDate)}</div>
      <div class="optimal-date-sub">${data.independence.monthsToReady}개월 준비 권장</div>
    </div>

    <h2 style="margin-top: 15px;">📌 독립 전 필수 체크포인트</h2>
    <table>
      <thead>
        <tr>
          <th>항목</th>
          <th>기준</th>
          <th style="text-align:center;">현재 상태</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>월 저축률</td>
          <td>20% 이상</td>
          <td style="text-align:center; color: ${data.projectedScore >= 70 ? '#16a34a' : '#dc2626'}">
            ${data.projectedScore >= 70 ? '✓' : '✗'}
          </td>
        </tr>
        <tr>
          <td>비상금</td>
          <td>월 지출 3배</td>
          <td style="text-align:center; color: ${data.emergencyPlan.gap <= 0 ? '#16a34a' : '#dc2626'}">
            ${data.emergencyPlan.gap <= 0 ? '✓' : '✗'}
          </td>
        </tr>
        <tr>
          <td>주거비 비율</td>
          <td>30% 이하</td>
          <td style="text-align:center; color: #16a34a">✓</td>
        </tr>
      </tbody>
    </table>

    <h2 style="margin-top: 15px;">🛡️ 비상금 마련 계획</h2>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px;">
      <div class="emergency-stat">
        <div class="emergency-stat-label">현재 비상금</div>
        <div class="emergency-stat-value">${data.emergencyPlan.currentFund}만원</div>
      </div>
      <div class="emergency-stat">
        <div class="emergency-stat-label">권장 비상금</div>
        <div class="emergency-stat-value">${data.emergencyPlan.recommendedFund}만원</div>
      </div>
      <div class="emergency-stat">
        <div class="emergency-stat-label">부족액</div>
        <div class="emergency-stat-value danger">${data.emergencyPlan.gap}만원</div>
      </div>
    </div>

    <div style="font-size: 10px;">
      ${(() => {
        const maxMonths = Math.max(...data.emergencyPlan.plans.map(p => p.months));
        return data.emergencyPlan.plans.slice(0, 3).map(plan => `
          <div class="emergency-bar-item">
            <span class="emergency-bar-label ${plan.recommended ? 'recommended' : ''}">월 ${plan.monthly}만원</span>
            <div class="emergency-bar-bg">
              <div class="emergency-bar-fill" style="width: ${Math.round((1 - plan.months / maxMonths) * 100 + 20)}%"></div>
            </div>
            <span class="emergency-bar-months ${plan.recommended ? 'recommended' : ''}">${plan.months}개월 ${plan.recommended ? '✓ 권장' : ''}</span>
          </div>
        `).join('');
      })()}
    </div>
  </div>
  <div class="footer">독립점수 · canilivealone.help@gmail.com</div>
</div>

<!-- 페이지 6: 체크리스트 + 목표 추적 (최종) -->
<div class="page">
  <div class="page-content">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">
          <svg width="14" height="14" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
            <path d="M20 50L50 65L80 50" stroke="white" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.7"/>
          </svg>
        </div>
        <span class="logo-text">독립점수</span>
      </div>
      <span class="page-info">점수 상승 설계 리포트 · 6/6</span>
    </div>

    <div style="background: linear-gradient(135deg, #0F3D2E 0%, #1a5c45 100%); color: white; border-radius: 8px; padding: 12px 15px; margin-bottom: 12px;">
      <div style="font-size: 10px; opacity: 0.8;">${data.userName ? data.userName + ' 님의 ' : ''}맞춤 설계 리포트</div>
      <div style="font-size: 14px; font-weight: 700;">현재 ${data.score}점 → 목표 ${data.projectedScore}점 (+${data.optimalAdjustments.totalScoreDiff}점)</div>
    </div>

    <h2>✅ 즉시 실행 체크리스트</h2>
    <div class="checklist-grid">
      <div class="checklist-section">
        <div class="checklist-title">⚡ 오늘 (5분)</div>
        <ul class="checklist">
          <li>안 쓰는 구독 1개 해지</li>
          <li>저축 자동이체 설정</li>
          <li>지출 기록 앱 설치</li>
        </ul>
      </div>
      <div class="checklist-section">
        <div class="checklist-title">📅 이번 주</div>
        <ul class="checklist">
          <li>3개월 카드명세서 분석</li>
          <li>고정비 리스트업</li>
          <li>불필요 지출 3개 찾기</li>
        </ul>
      </div>
      <div class="checklist-section">
        <div class="checklist-title">🎯 이번 달</div>
        <ul class="checklist">
          <li>통신비 요금제 변경</li>
          <li>비상금 통장 개설</li>
          <li>보험 중복 가입 확인</li>
        </ul>
      </div>
    </div>

    <h2 style="margin-top: 15px;">📊 목표 달성 추적표</h2>
    <table>
      <thead>
        <tr>
          <th>기간</th>
          <th style="text-align:center;">목표 점수</th>
          <th style="text-align:center;">핵심 행동</th>
          <th style="text-align:center;">달성</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1개월 후</td>
          <td style="text-align:center;">${Math.min(data.score + 5, 100)}점</td>
          <td style="text-align:center;">새는 돈 막기</td>
          <td style="text-align:center;">☐</td>
        </tr>
        <tr>
          <td>2개월 후</td>
          <td style="text-align:center;">${Math.min(data.score + 7, 100)}점</td>
          <td style="text-align:center;">고정비 최적화</td>
          <td style="text-align:center;">☐</td>
        </tr>
        <tr>
          <td>3개월 후</td>
          <td style="text-align:center;">${data.projectedScore}점</td>
          <td style="text-align:center;">저축 자동화</td>
          <td style="text-align:center;">☐</td>
        </tr>
        <tr style="background: #f0fdf4;">
          <td><strong>6개월 후</strong></td>
          <td style="text-align:center;"><strong>${Math.min(data.projectedScore + 3, 100)}점</strong></td>
          <td style="text-align:center;"><strong>습관 정착</strong></td>
          <td style="text-align:center;">☐</td>
        </tr>
      </tbody>
    </table>

    <h2 style="margin-top: 15px;">💡 성공을 위한 핵심 팁</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <div style="background: #f8f9fa; border-radius: 6px; padding: 10px; font-size: 9px;">
        <strong style="color: #0F3D2E;">✓ 별도 통장 분리</strong><br>
        생활비와 비상금을 분리하세요
      </div>
      <div style="background: #f8f9fa; border-radius: 6px; padding: 10px; font-size: 9px;">
        <strong style="color: #0F3D2E;">✓ 자동이체 설정</strong><br>
        급여일 다음날 자동 저축
      </div>
      <div style="background: #f8f9fa; border-radius: 6px; padding: 10px; font-size: 9px;">
        <strong style="color: #0F3D2E;">✓ 지출 기록 습관</strong><br>
        매일 1분 지출 체크
      </div>
      <div style="background: #f8f9fa; border-radius: 6px; padding: 10px; font-size: 9px;">
        <strong style="color: #0F3D2E;">✓ 목표 시각화</strong><br>
        진행률을 눈에 보이게
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #0F3D2E 0%, #1a5c45 100%); color: white; border-radius: 10px; padding: 18px; margin-top: 15px; text-align: center;">
      <div style="font-size: 11px; opacity: 0.8; margin-bottom: 8px;">이 리포트가 도움이 되셨나요?</div>
      <div style="font-size: 14px; font-weight: 700; margin-bottom: 4px;">3개월 후 다시 진단해 점수 상승을 확인하세요</div>
      <div style="font-size: 18px; font-weight: 800; color: #86efac;">목표: +${data.optimalAdjustments.totalScoreDiff}점</div>
      <div style="font-size: 10px; opacity: 0.7; margin-top: 10px;">
        canilivealone.com 에서 무료 재진단
      </div>
    </div>
  </div>
  <div class="footer">
    📌 ${formatDate(data.generatedAt)} 생성 · 독립점수 · canilivealone.help@gmail.com
  </div>
</div>

</body>
</html>
`;
}
