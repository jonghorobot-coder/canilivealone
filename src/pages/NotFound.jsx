import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-dvh bg-white flex items-center justify-center">
      <div className="w-full max-w-md mx-auto px-5">
        <div className="text-center">
          {/* 아이콘 */}
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#E8F3EF] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#0F3D2E]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* 텍스트 */}
          <p className="text-[11px] tracking-[0.1em] text-neutral-500 uppercase font-medium mb-3">
            404 Error
          </p>
          <h1 className="text-[22px] font-bold text-neutral-900 tracking-tight mb-2">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-[15px] text-neutral-500 leading-relaxed mb-8">
            요청하신 페이지가 존재하지 않거나<br />
            이동되었을 수 있습니다.
          </p>

          {/* 버튼 */}
          <Link
            to="/"
            className="block w-full h-[52px] rounded-[10px] bg-[#0F3D2E] hover:bg-[#0a2e22] text-white text-[15px] font-semibold shadow-sm transition-colors tracking-tight leading-[52px] text-center"
            aria-label="홈으로 이동"
          >
            홈으로 이동
          </Link>

          {/* 서브 텍스트 */}
          <p className="mt-4 text-[13px] text-neutral-500">
            독립점수 진단을 시작해보세요
          </p>
        </div>
      </div>
    </div>
  );
}
