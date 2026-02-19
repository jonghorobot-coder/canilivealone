export function formatNumber(value) {
  if (!value && value !== 0) return '';
  const num = typeof value === 'string' ? value.replace(/[^\d]/g, '') : String(value);
  if (!num) return '';
  return Number(num).toLocaleString('ko-KR');
}

export function parseNumber(value) {
  if (!value) return '';
  const num = String(value).replace(/[^\d]/g, '');
  return num;
}

export function formatCurrency(value) {
  if (!value && value !== 0) return '0만원';
  const num = typeof value === 'string' ? parseInt(value.replace(/[^\d]/g, ''), 10) : value;
  if (isNaN(num)) return '0만원';
  return `${num.toLocaleString('ko-KR')}만원`;
}
