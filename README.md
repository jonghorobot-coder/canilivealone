# 독립점수 (Can I Live Alone?)

> 월 수입과 지출 구조를 기반으로 재무 독립 가능성을 분석하는 웹 서비스

[![Version](https://img.shields.io/badge/version-2.1.0-0F3D2E)](https://github.com/jonghorobot-coder/canilivealone/releases/tag/v2.1.0)
[![Deploy](https://img.shields.io/badge/deploy-Vercel-black)](https://canilivealone.com)

## 서비스 소개

**독립점수**는 20-30대를 위한 재무 자립도 진단 서비스입니다.
25개 분석 항목과 7개 카테고리를 기반으로 독립 가능성을 점수화하여 제공합니다.

### 주요 기능

- 월 수입·지출 기반 재무 분석
- 5단계 등급 시스템 (매우 안정 ~ 매우 위험)
- 카테고리별 점수 및 리스크 분석
- 목표 점수 시뮬레이션
- 결과 공유 (링크 복사, 이미지 저장, 카카오톡)
- 프리미엄 리포트 (유료)

## 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 19, Vite 7, TailwindCSS 4 |
| Backend | Supabase (PostgreSQL) |
| Deploy | Vercel |
| Analytics | Google Analytics 4 |

## 프로젝트 구조

```
canilivealone/
├── public/                     # 정적 파일
│   ├── favicon.svg             # 파비콘 (SVG)
│   ├── favicon-*.png           # 파비콘 (PNG 다양한 크기)
│   ├── apple-touch-icon.png    # iOS 홈화면 아이콘
│   ├── og-image.png            # Open Graph 이미지
│   ├── site.webmanifest        # PWA 매니페스트
│   ├── robots.txt              # 크롤러 설정
│   └── sitemap.xml             # 사이트맵
│
├── src/
│   ├── components/
│   │   ├── common/             # 공통 UI 컴포넌트
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── NumberInput.jsx
│   │   │   └── ProgressBar.jsx
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   │   └── StepLayout.jsx
│   │   ├── steps/              # 진단 스텝 컴포넌트
│   │   │   ├── IntroStep.jsx
│   │   │   ├── ExpenseStep.jsx
│   │   │   ├── QuestionStep.jsx
│   │   │   └── ResultStep.jsx
│   │   └── ErrorBoundary.jsx   # 에러 처리
│   │
│   ├── context/
│   │   └── SurveyContext.jsx   # 전역 상태 관리
│   │
│   ├── data/
│   │   ├── expenseCategories.js # 지출 카테고리 정의
│   │   └── questions.js         # 설문 문항 정의
│   │
│   ├── hooks/
│   │   ├── useLocalStorage.js  # localStorage 훅
│   │   └── useSurvey.js        # 설문 상태 훅
│   │
│   ├── layout/
│   │   └── CoreLayout.jsx      # 앱 코어 레이아웃
│   │
│   ├── lib/
│   │   └── supabase.js         # Supabase 클라이언트
│   │
│   ├── pages/
│   │   ├── AdminPage.jsx       # 관리자 페이지
│   │   ├── NotFound.jsx        # 404 페이지
│   │   ├── PrivacyPolicy.jsx   # 개인정보 처리방침
│   │   └── TermsOfService.jsx  # 이용약관
│   │
│   ├── utils/
│   │   ├── analytics.js        # GA4 이벤트 추적
│   │   ├── calculate.js        # 점수 계산 로직
│   │   ├── format.js           # 숫자 포맷팅
│   │   ├── generatePdf.js      # PDF 리포트 생성
│   │   ├── goalSimulation.js   # 목표 시뮬레이션
│   │   ├── reportData.js       # 리포트 데이터 분석
│   │   ├── reportTemplate.js   # 리포트 템플릿
│   │   ├── saveResult.js       # 결과 저장/조회
│   │   └── scoreSimulation.js  # 점수 시뮬레이션
│   │
│   ├── App.jsx                 # 라우팅 설정
│   ├── main.jsx                # 앱 진입점
│   └── index.css               # 전역 스타일
│
├── scripts/
│   └── generate-og-image.js    # OG 이미지 생성 스크립트
│
├── index.html                  # HTML 템플릿
├── vite.config.js              # Vite 설정
├── vercel.json                 # Vercel 배포 설정
├── package.json                # 의존성 관리
└── .env.example                # 환경변수 예시
```

## 시작하기

### 1. 클론

```bash
git clone https://github.com/jonghorobot-coder/canilivealone.git
cd canilivealone
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 다음 값을 설정:

```env
VITE_GA_ID=G-XXXXXXXXXX
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. 빌드

```bash
npm run build
```

## 배포

Vercel에 연결하면 `main` 브랜치 push 시 자동 배포됩니다.

## 변경 이력 (Changelog)

### v2.1.0 (2025-02-25)

**결과 페이지 UX 개선**
- 모바일/데스크톱/공유 방문자별 최적화된 UI 제공
- 중복 공유 CTA 섹션 제거 및 통합
- 공유 방문자용 "나도 진단받기" CTA 점수 카드 내 배치
- 프리미엄 CTA: 공유 방문자에게는 미표시 (본인 결과에서만 노출)
- "독립 준비도 인덱스" 제거 (카테고리 점수와 중복)

**관리자 페이지 개선**
- 상태 업데이트 시 실제 저장 여부 확인 로직 추가
- RLS 정책 오류 시 명확한 에러 메시지 표시
- 새로고침 버튼 추가

**핵심 원칙**
- 무료로도 충분한 독립 가능성 분석 제공
- 점수, 등급, 7개 카테고리 분석, 리스크 요인, 개선 방안 모두 무료
- 프리미엄은 "점수 상승 설계 리포트"로 부가 가치 제공

### v2.0.0 (2025-02-24)

- 전면 리뉴얼 (React 19 + Vite 7 + TailwindCSS 4)
- 점수 산정 로직 고도화 (7개 카테고리 가중 평균)
- 프리미엄 리포트 시스템 도입
- 목표 점수 시뮬레이션 기능
- 공유 기능 강화 (카카오톡, 이미지 저장, 링크 복사)

## 라이선스

이 프로젝트의 코드는 비공개이며, 무단 복제 및 배포를 금지합니다.

## 문의

- 서비스: [canilivealone.com](https://canilivealone.com)
- 이메일: canilivealone.help@gmail.com
