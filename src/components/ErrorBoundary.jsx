import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    console.error('[ErrorBoundary] Error:', error);
    console.error('[ErrorBoundary] Component Stack:', errorInfo.componentStack);

    // 향후 Sentry 등 외부 서비스 연동 시 여기에 추가
    // Example: Sentry.captureException(error, { extra: errorInfo });
    if (typeof window !== 'undefined' && window.reportError) {
      window.reportError({
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    }
  }

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-white flex items-center justify-center">
          <div className="w-full max-w-md mx-auto px-5">
            <div className="text-center">
              {/* 아이콘 */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#FEF3F2] flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#B42318]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* 텍스트 */}
              <p className="text-[11px] tracking-[0.1em] text-neutral-400 uppercase font-medium mb-3">
                Error
              </p>
              <h1 className="text-[22px] font-bold text-neutral-900 tracking-tight mb-2">
                문제가 발생했습니다
              </h1>
              <p className="text-[15px] text-neutral-500 leading-relaxed mb-8">
                일시적인 오류가 발생했습니다.<br />
                페이지를 새로고침 해주세요.
              </p>

              {/* 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRefresh}
                  className="w-full h-[52px] rounded-[10px] bg-[#0F3D2E] hover:bg-[#0a2e22] text-white text-[15px] font-semibold shadow-sm transition-colors tracking-tight"
                  aria-label="현재 페이지 새로고침"
                >
                  새로고침
                </button>
                <a
                  href="/"
                  className="block w-full h-[52px] rounded-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[15px] font-semibold transition-colors tracking-tight leading-[52px] text-center"
                  aria-label="홈으로 이동"
                >
                  홈으로 이동
                </a>
              </div>

              {/* 서브 텍스트 */}
              <p className="mt-4 text-[13px] text-neutral-400">
                문제가 지속되면 잠시 후 다시 시도해주세요
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
