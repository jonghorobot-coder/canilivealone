/**
 * PDF 생성 유틸리티
 */
import { generateReportData } from './reportData';
import { generateReportHTML } from './reportTemplate';

/**
 * 리포트를 새 창에서 열고 인쇄 다이얼로그 표시
 * (인쇄 → PDF로 저장 선택)
 */
export async function generateReportPdf(result, income, expenses, userAge = 25, userEmail = '') {
  // 미리보기 창 열고 인쇄 다이얼로그 자동 실행
  const reportData = generateReportData(result, income, expenses, userAge, userEmail);
  const html = generateReportHTML(reportData);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // 로드 완료 후 인쇄 다이얼로그
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };
  }

  return true;
}

/**
 * 리포트 HTML 미리보기 (새 창에서 열기)
 */
export function previewReportHTML(result, income, expenses, userAge = 25, userEmail = '') {
  const reportData = generateReportData(result, income, expenses, userAge, userEmail);
  const html = generateReportHTML(reportData);

  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
  }

  return reportData;
}

/**
 * 리포트 데이터만 생성 (API용)
 */
export function getReportData(result, income, expenses, userAge = 25, userEmail = '') {
  return generateReportData(result, income, expenses, userAge, userEmail);
}
