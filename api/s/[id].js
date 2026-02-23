import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

// 등급별 문구
const GRADE_MESSAGES = {
  '매우 안정': '매우 안정적인 독립이 가능합니다',
  '안정': '안정적인 독립이 가능합니다',
  '주의': '독립 전 준비가 필요합니다',
  '위험': '재정 개선이 필요합니다',
  '매우 위험': '독립을 권장하지 않습니다',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const resultId = pathParts[pathParts.length - 1];

  if (!resultId) {
    return Response.redirect(`${url.origin}`, 302);
  }

  const resultUrl = `${url.origin}/result?id=${resultId}`;

  // Supabase에서 결과 조회
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return Response.redirect(resultUrl, 302);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('results')
      .select('score, grade')
      .eq('id', resultId)
      .single();

    if (error || !data) {
      return Response.redirect(resultUrl, 302);
    }

    const { score, grade } = data;
    const gradeMessage = GRADE_MESSAGES[grade] || '';
    const ogImageUrl = `${url.origin}/api/og?score=${score}&grade=${encodeURIComponent(grade)}`;

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>독립점수 ${score}점 | ${grade}</title>
  <meta name="description" content="${gradeMessage}. 나도 독립 준비도 진단받기 - canilivealone.com">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:title" content="독립점수 ${score}점 | ${grade}">
  <meta property="og:description" content="${gradeMessage}. 나도 무료로 진단받기 →">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${url.origin}/s/${resultId}">
  <meta property="og:site_name" content="독립점수">
  <meta property="og:locale" content="ko_KR">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="독립점수 ${score}점 | ${grade}">
  <meta name="twitter:description" content="${gradeMessage}. 나도 무료로 진단받기 →">
  <meta name="twitter:image" content="${ogImageUrl}">

  <link rel="canonical" href="${url.origin}/s/${resultId}">

  <!-- 브라우저는 결과 페이지로 리다이렉트 -->
  <meta http-equiv="refresh" content="0;url=${resultUrl}">
</head>
<body style="font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0F3D2E;">
  <div style="text-align: center; color: white;">
    <p style="font-size: 18px; margin-bottom: 8px;">결과 페이지로 이동 중...</p>
    <p style="font-size: 14px; opacity: 0.7;">자동으로 이동하지 않으면 <a href="${resultUrl}" style="color: white;">여기</a>를 클릭하세요.</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Error fetching result:', err);
    return Response.redirect(resultUrl, 302);
  }
}
