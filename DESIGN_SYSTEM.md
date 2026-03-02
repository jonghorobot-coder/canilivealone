# 독립점수 디자인 시스템

## 1. 타이포그래피 (Typography)

### 반응형 텍스트 클래스
`clamp(최소값, 선호값, 최대값)` 방식으로 화면 너비에 따라 자동 조절됩니다.

| 클래스 | 크기 범위 | 용도 |
|--------|-----------|------|
| `text-responsive-xs` | 11px ~ 12px | 캡션, 라벨, 배지 |
| `text-responsive-sm` | 13px ~ 14px | 보조 설명, 날짜 |
| `text-responsive-base` | 14px ~ 15px | 부가 설명 텍스트 |
| `text-responsive-md` | 15px ~ 16px | 본문 텍스트 |
| `text-responsive-lg` | 16px ~ 18px | 카드 제목, 강조 본문 |
| `text-responsive-xl` | 18px ~ 20px | 섹션 소제목 |
| `text-responsive-2xl` | 20px ~ 22px | 중요 숫자, 중제목 |
| `text-responsive-3xl` | 22px ~ 24px | 페이지 제목 |
| `text-responsive-4xl` | 28px ~ 32px | 히어로 제목 |
| `text-responsive-5xl` | 36px ~ 42px | 대형 히어로 |

### 사용 규칙

```jsx
// 기본 패턴: 모바일 반응형 + 데스크톱 고정값 (필요시)
<h1 className="text-responsive-3xl">페이지 제목</h1>
<p className="text-responsive-md">본문 텍스트</p>
<span className="text-responsive-xs">캡션</span>
```

### 컴포넌트별 적용 가이드

| 컴포넌트 | 제목 | 본문 | 보조 텍스트 |
|----------|------|------|-------------|
| 카드 헤더 | `text-responsive-lg` | `text-responsive-base` | `text-responsive-xs` |
| 모달 | `text-responsive-xl` | `text-responsive-md` | `text-responsive-sm` |
| 버튼 | `text-responsive-md` ~ `text-responsive-lg` | - | - |
| 입력 필드 | - | `text-responsive-md` ~ `text-responsive-2xl` | `text-responsive-base` |
| 아코디언 | `text-responsive-lg` | `text-responsive-base` | `text-responsive-xs` |

---

## 2. 색상 시스템 (Colors)

### 브랜드 컬러
```
Primary (딥그린): #0F3D2E
Primary Dark: #0a2e22
Primary Light: #1a5c45
Accent (민트): #6EE7B7
```

### 시맨틱 컬러
```
Success: emerald-100 ~ emerald-700
Warning: amber-100 ~ amber-700
Error: red-100 ~ red-700
```

### 중립 컬러
```
텍스트 강조: neutral-800
텍스트 기본: neutral-700
텍스트 보조: neutral-500
텍스트 약함: neutral-400
배경: neutral-50, neutral-100
테두리: neutral-100, neutral-200
```

### 등급별 색상
| 등급 | 배경 | 텍스트 |
|------|------|--------|
| 매우 안정 / 안정 | `bg-emerald-100` | `text-emerald-700` |
| 주의 | `bg-amber-100` | `text-amber-700` |
| 위험 / 매우 위험 | `bg-red-100` | `text-red-700` |

---

## 3. 간격 시스템 (Spacing)

### 반응형 패딩/마진
```
모바일 → 데스크톱
p-4 → sm:p-5      (16px → 20px)
p-3 → sm:p-4      (12px → 16px)
gap-2.5 → sm:gap-3 (10px → 12px)
gap-3 → sm:gap-4   (12px → 16px)
```

### 컴포넌트 내부 간격
| 요소 | 모바일 | 데스크톱 |
|------|--------|----------|
| 카드 패딩 | `p-4` | `sm:p-5` |
| 모달 패딩 | `p-4` ~ `p-5` | `sm:p-5` ~ `sm:p-6` |
| 섹션 간격 | `space-y-3` | `sm:space-y-4` |
| 아이템 간격 | `gap-2.5` | `sm:gap-3` |

---

## 4. 크기 시스템 (Sizing)

### 반응형 크기 클래스
```css
.w-responsive-input { width: clamp(110px, 30vw, 140px); }
.h-responsive-input { height: clamp(48px, 12vw, 56px); }
.size-responsive-icon-sm { width/height: clamp(24px, 6vw, 28px); }
.size-responsive-icon { width/height: clamp(28px, 7vw, 32px); }
.size-responsive-icon-lg { width/height: clamp(44px, 11vw, 56px); }
```

### 버튼 높이
| 크기 | 모바일 | 데스크톱 |
|------|--------|----------|
| 기본 | `h-11` (44px) | `sm:h-12` (48px) |
| 대형 | `h-12` (48px) | `sm:h-14` (56px) |

### 아이콘 크기
| 용도 | 모바일 | 데스크톱 |
|------|--------|----------|
| 인라인 | `w-4 h-4` | `sm:w-5 sm:h-5` |
| 카드 내 | `w-7 h-7` | `sm:w-8 sm:h-8` |
| 강조 | `w-10 h-10` | `sm:w-12 sm:h-12` |

---

## 5. 모서리 반경 (Border Radius)

| 요소 | 모바일 | 데스크톱 |
|------|--------|----------|
| 버튼 | `rounded-xl` (12px) | 동일 |
| 카드 | `rounded-2xl` (16px) | `sm:rounded-3xl` (24px) |
| 모달 | `rounded-2xl` (16px) | `sm:rounded-3xl` (24px) |
| 입력 필드 | `rounded-xl` (12px) ~ `rounded-2xl` (16px) | 동일 |
| 배지/태그 | `rounded-full` 또는 `rounded-md` | 동일 |
| 아이콘 박스 | `rounded-lg` (8px) ~ `rounded-xl` (12px) | 동일 |

---

## 6. 그림자 (Shadows)

| 용도 | 클래스 |
|------|--------|
| 카드 기본 | `shadow-md` |
| 카드 강조 | `shadow-lg` |
| 모달 | `shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]` |
| 버튼 활성 | `shadow-lg` |
| 플로팅 요소 | `shadow-xl` ~ `shadow-2xl` |

---

## 7. 컴포넌트 패턴

### 아코디언 (Details)
```jsx
<details className="bg-white rounded-2xl shadow-md group">
  <summary className="p-4 sm:p-5 cursor-pointer flex items-center justify-between list-none">
    <div className="flex-1">
      <span className="text-responsive-lg font-bold text-neutral-800">제목</span>
      <p className="text-responsive-base text-neutral-500 mt-1">설명</p>
    </div>
    <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-neutral-400 transition-transform group-open:rotate-180">
      {/* 화살표 아이콘 */}
    </svg>
  </summary>
  <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-neutral-100 pt-4">
    {/* 내용 */}
  </div>
</details>
```

### 모달
```jsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
  {/* 배경 */}
  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

  {/* 모달 본체 */}
  <div className="relative bg-white rounded-2xl sm:rounded-3xl w-full max-w-sm shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]">
    {/* 내용 */}
  </div>
</div>
```

### 카드
```jsx
<div className="bg-white rounded-2xl sm:rounded-3xl shadow-md ring-1 ring-black/[0.04] p-4 sm:p-5">
  {/* 내용 */}
</div>
```

### 버튼 (Primary)
```jsx
<button className="w-full h-11 sm:h-12 rounded-xl bg-[#0F3D2E] text-white text-responsive-md font-bold hover:bg-[#0a2e22] transition-all duration-200 shadow-lg">
  버튼 텍스트
</button>
```

### 버튼 (Secondary)
```jsx
<button className="h-11 sm:h-12 px-5 sm:px-6 rounded-xl border border-neutral-200 text-neutral-600 text-responsive-sm font-semibold hover:bg-neutral-50 transition-colors">
  버튼 텍스트
</button>
```

---

## 8. 애니메이션

### 트랜지션
```
기본: transition-colors, transition-all duration-200
호버 효과: hover:bg-*, hover:scale-[1.02]
포커스: focus:outline-none focus:border-[#0F3D2E]
```

### 커스텀 애니메이션 클래스
```
animate-overlay-bg: 모달 배경 페이드인
animate-overlay-content: 모달 콘텐츠 슬라이드업
animate-stagger: 순차 등장 애니메이션
animate-fade-in: 단순 페이드인
group-open:rotate-180: 아코디언 화살표 회전
```

---

## 9. 브레이크포인트

| 이름 | 너비 | 용도 |
|------|------|------|
| 기본 (모바일) | < 640px | 모바일 우선 스타일 |
| `sm:` | >= 640px | 대형 모바일, 태블릿 |
| `lg:` | >= 1024px | 데스크톱 |
| `xl:` | >= 1280px | 대형 데스크톱 |

---

## 10. 체크리스트

새 컴포넌트 작성 시 확인사항:

- [ ] 텍스트에 `text-responsive-*` 클래스 적용
- [ ] 모바일/데스크톱 간격 `p-4 sm:p-5` 패턴 적용
- [ ] 카드 모서리 `rounded-2xl` 사용
- [ ] 그림자 `shadow-md` 기본 적용
- [ ] 버튼 높이 `h-11 sm:h-12` 패턴 적용
- [ ] 색상은 시맨틱 컬러 시스템 준수
- [ ] 아이콘 크기 `w-4 h-4 sm:w-5 sm:h-5` 패턴 적용
