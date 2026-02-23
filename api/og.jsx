import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

const GRADE_STYLES = {
  '매우 안정': { bg: '#E8F3EF', text: '#0F3D2E', label: '독립 준비 완료' },
  '안정': { bg: '#E8F3EF', text: '#0F3D2E', label: '안정적 독립 가능' },
  '주의': { bg: '#FFF7E5', text: '#9A6B00', label: '일부 준비 필요' },
  '위험': { bg: '#FDECEC', text: '#912018', label: '재정 개선 필요' },
  '매우 위험': { bg: '#FDECEC', text: '#912018', label: '독립 재고 필요' },
};

function getScoreColor(score) {
  if (score >= 70) return '#0F3D2E';
  if (score >= 50) return '#C58A00';
  return '#B42318';
}

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score');
  const grade = searchParams.get('grade');

  if (score && grade) {
    const scoreNum = parseInt(score, 10);
    const gradeStyle = GRADE_STYLES[grade] || GRADE_STYLES['주의'];
    const scoreColor = getScoreColor(scoreNum);

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            backgroundColor: '#0F3D2E',
          }}
        >
          <div
            style={{
              width: '400px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '60px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
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
                  marginRight: '16px',
                  fontSize: '28px',
                }}
              >
                📊
              </div>
              <span style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>
                독립점수
              </span>
            </div>

            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              재무 자립 가능성 분석 결과
            </p>

            <div
              style={{
                display: 'flex',
                marginTop: 'auto',
              }}
            >
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>
                나도 진단받기 → canilivealone.com
              </span>
            </div>
          </div>

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
                backgroundColor: 'white',
                borderRadius: '32px',
                padding: '50px 80px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  marginBottom: '24px',
                }}
              >
                <span
                  style={{
                    fontSize: '140px',
                    fontWeight: 800,
                    color: scoreColor,
                    lineHeight: 1,
                  }}
                >
                  {scoreNum}
                </span>
                <span style={{ fontSize: '40px', color: '#9CA3AF', marginLeft: '8px' }}>
                  점
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  backgroundColor: gradeStyle.bg,
                  padding: '16px 32px',
                  borderRadius: '9999px',
                  marginBottom: '20px',
                }}
              >
                <span style={{ fontSize: '24px', fontWeight: 700, color: gradeStyle.text }}>
                  {grade}
                </span>
              </div>

              <p style={{ fontSize: '22px', color: '#6B7280', margin: 0 }}>
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

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0F3D2E',
        }}
      >
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
            fontSize: '40px',
          }}
        >
          📊
        </div>

        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '4px',
            margin: '0 0 16px 0',
          }}
        >
          FINANCIAL INDEPENDENCE SCORE
        </p>

        <h1
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: 'white',
            margin: '0 0 24px 0',
          }}
        >
          독립점수
        </h1>

        <p
          style={{
            fontSize: '26px',
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 48px 0',
            textAlign: 'center',
          }}
        >
          월 수입과 지출 구조로 분석하는 재무 자립 가능성 진단
        </p>

        <div
          style={{
            display: 'flex',
            backgroundColor: 'white',
            padding: '20px 48px',
            borderRadius: '16px',
          }}
        >
          <span style={{ fontSize: '22px', fontWeight: 700, color: '#0F3D2E' }}>
            무료 진단 시작하기
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: '48px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '48px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>2분</span>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>소요 시간</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: '48px' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>25개</span>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>분석 항목</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '32px', fontWeight: 700, color: 'white' }}>7개</span>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>카테고리</span>
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
