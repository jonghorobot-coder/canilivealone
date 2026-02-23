import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

// 등급별 스타일
const GRADE_STYLES = {
  '매우 안정': { bg: '#E8F3EF', text: '#0F3D2E', label: '독립 준비 완료' },
  '안정': { bg: '#E8F3EF', text: '#0F3D2E', label: '안정적 독립 가능' },
  '주의': { bg: '#FFF7E5', text: '#9A6B00', label: '일부 준비 필요' },
  '위험': { bg: '#FDECEC', text: '#912018', label: '재정 개선 필요' },
  '매우 위험': { bg: '#FDECEC', text: '#912018', label: '독립 재고 필요' },
};

// 점수에 따른 색상
function getScoreColor(score) {
  if (score >= 70) return '#0F3D2E';
  if (score >= 50) return '#C58A00';
  return '#B42318';
}

export default async function handler(request) {
  const { searchParams } = new URL(request.url);

  const score = searchParams.get('score');
  const grade = searchParams.get('grade');

  // 결과 페이지용 OG (점수와 등급이 있는 경우)
  if (score && grade) {
    const scoreNum = parseInt(score, 10);
    const gradeStyle = GRADE_STYLES[grade] || GRADE_STYLES['주의'];
    const scoreColor = getScoreColor(scoreNum);

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            display: 'flex',
            background: 'linear-gradient(135deg, #0a2e1f 0%, #0F3D2E 50%, #1a5c45 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          {/* 왼쪽 영역 - 브랜드 */}
          <div
            style={{
              width: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '60px',
            }}
          >
            {/* 로고 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '40px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="30" height="30" viewBox="0 0 100 100">
                  <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
                  <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
                  <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>
              <span style={{ fontSize: '28px', fontWeight: '700', color: 'white' }}>
                독립점수
              </span>
            </div>

            {/* 설명 문구 */}
            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', margin: 0 }}>
              재무 자립 가능성 분석 결과
            </p>

            {/* 하단 CTA */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: 'auto',
                paddingTop: '60px',
              }}
            >
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)' }}>
                나도 진단받기
              </span>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
                canilivealone.com
              </span>
            </div>
          </div>

          {/* 오른쪽 영역 - 결과 카드 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '600px',
                backgroundColor: 'white',
                borderRadius: '32px',
                padding: '50px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
              }}
            >
              {/* 점수 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '8px',
                  marginBottom: '24px',
                }}
              >
                <span
                  style={{
                    fontSize: '140px',
                    fontWeight: '800',
                    color: scoreColor,
                    lineHeight: 1,
                    letterSpacing: '-6px',
                  }}
                >
                  {scoreNum}
                </span>
                <span style={{ fontSize: '40px', color: '#9CA3AF', fontWeight: '500' }}>
                  점
                </span>
              </div>

              {/* 등급 배지 */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: gradeStyle.bg,
                  padding: '16px 32px',
                  borderRadius: '9999px',
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontSize: '24px', fontWeight: '700', color: gradeStyle.text }}>
                  {grade}
                </span>
              </div>

              {/* 결과 문구 */}
              <p style={{ fontSize: '22px', color: '#6B7280', margin: 0, textAlign: 'center' }}>
                {gradeStyle.label}
              </p>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }

  // 메인 사이트용 OG (기본)
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: 'linear-gradient(135deg, #0a2e1f 0%, #0F3D2E 50%, #1a5c45 100%)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          {/* 로고 */}
          <div
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px',
            }}
          >
            <svg width="44" height="44" viewBox="0 0 100 100">
              <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
              <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
              <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>

          {/* 서브 타이틀 */}
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              margin: '0 0 16px 0',
            }}
          >
            Financial Independence Score
          </p>

          {/* 메인 타이틀 */}
          <h1
            style={{
              fontSize: '72px',
              fontWeight: '800',
              color: 'white',
              margin: '0 0 24px 0',
              letterSpacing: '-2px',
            }}
          >
            독립점수
          </h1>

          {/* 설명 */}
          <p
            style={{
              fontSize: '26px',
              color: 'rgba(255,255,255,0.7)',
              margin: '0 0 48px 0',
              lineHeight: '1.5',
            }}
          >
            월 수입과 지출 구조로 분석하는<br />재무 자립 가능성 진단
          </p>

          {/* CTA 버튼 스타일 */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'white',
              padding: '20px 48px',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#0F3D2E' }}>
              무료 진단 시작하기
            </span>
          </div>

          {/* 하단 통계 */}
          <div
            style={{
              display: 'flex',
              gap: '48px',
              marginTop: '48px',
              paddingTop: '32px',
              borderTop: '1px solid rgba(255,255,255,0.15)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '700', color: 'white' }}>2분</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>소요 시간</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '700', color: 'white' }}>25개</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>분석 항목</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '32px', fontWeight: '700', color: 'white' }}>7개</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>카테고리</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
