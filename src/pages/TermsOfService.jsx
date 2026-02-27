import { Link } from 'react-router-dom';

export function TermsOfService() {
  return (
    <div className="min-h-dvh bg-white">
      <div className="w-full max-w-2xl mx-auto px-5 py-12">
        {/* 헤더 */}
        <header className="mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[14px] text-neutral-500 hover:text-[#0F3D2E] transition-colors mb-6"
            aria-label="홈으로 돌아가기"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로
          </Link>
          <h1 className="text-[28px] font-bold text-neutral-900 tracking-tight">
            서비스 이용약관
          </h1>
          <p className="text-[14px] text-neutral-500 mt-2">
            최종 수정일: 2025년 2월 22일
          </p>
        </header>

        {/* 본문 */}
        <article className="space-y-8 text-[15px] text-neutral-700 leading-relaxed">

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제1조 (목적)</h2>
            <p>
              이 약관은 독립점수(이하 "서비스")가 제공하는 재무 독립 가능성 진단 서비스의
              이용 조건 및 절차, 서비스와 이용자의 권리·의무 및 책임사항 등을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제2조 (정의)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                <span className="font-medium">"서비스"</span>란 이용자가 입력한 수입·지출 정보를 바탕으로
                재무 독립 가능성을 진단하고 결과를 제공하는 웹 기반 서비스를 말합니다.
              </li>
              <li>
                <span className="font-medium">"이용자"</span>란 서비스에 접속하여 이 약관에 따라
                서비스가 제공하는 기능을 이용하는 자를 말합니다.
              </li>
              <li>
                <span className="font-medium">"진단 결과"</span>란 이용자가 입력한 정보를 기반으로
                서비스가 산출한 독립 점수, 등급 및 분석 내용을 말합니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제3조 (약관의 효력 및 변경)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</li>
              <li>서비스는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 이 약관을 변경할 수 있습니다.</li>
              <li>변경된 약관은 적용일 7일 전부터 서비스 내 공지사항을 통해 고지됩니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제4조 (서비스의 제공)</h2>
            <p>서비스는 다음과 같은 기능을 제공합니다:</p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>월 수입 및 지출 정보 입력 기능</li>
              <li>재무 상황 관련 설문 응답 기능</li>
              <li>독립 가능성 점수 및 등급 산출</li>
              <li>카테고리별 재무 분석 결과 제공</li>
              <li>진단 결과 공유 기능 (링크 복사, 이미지 저장)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제5조 (서비스 이용)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스는 별도의 회원가입 없이 이용할 수 있습니다.</li>
              <li>이용자는 정확한 정보를 입력해야 하며, 허위 정보 입력으로 인한 결과에 대해 서비스는 책임지지 않습니다.</li>
              <li>서비스는 연중무휴 24시간 제공을 원칙으로 하나, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제6조 (진단 결과의 성격)</h2>
            <div className="bg-[#FFF7E5] border border-[#C58A00] rounded-lg p-4">
              <p className="font-semibold text-[#9A6B00] mb-2">중요 안내</p>
              <ul className="list-disc pl-5 space-y-1 text-[14px] text-[#9A6B00]">
                <li>진단 결과는 이용자가 입력한 정보를 기반으로 한 <strong>참고용 분석</strong>입니다.</li>
                <li>진단 결과는 <strong>전문적인 재무 상담을 대체하지 않습니다.</strong></li>
                <li>실제 독립 또는 재무 결정 시에는 전문가 상담을 권장합니다.</li>
                <li>서비스는 진단 결과를 바탕으로 한 이용자의 결정에 대해 책임지지 않습니다.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제7조 (이용자의 의무)</h2>
            <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>서비스를 이용하여 법령 또는 공서양속에 반하는 행위</li>
              <li>타인의 정보를 도용하여 서비스를 이용하는 행위</li>
              <li>서비스의 시스템에 대한 무단 접근 또는 해킹 시도</li>
              <li>서비스 내 정보를 무단으로 수집, 복제, 배포하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제8조 (지적재산권)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스가 제공하는 모든 콘텐츠(진단 알고리즘, 디자인, 텍스트, 이미지 등)에 대한 저작권은 서비스에 귀속됩니다.</li>
              <li>이용자는 서비스를 이용함으로써 얻은 정보를 서비스의 사전 승낙 없이 상업적으로 이용할 수 없습니다.</li>
              <li>이용자가 생성한 진단 결과 이미지는 개인적인 용도로 자유롭게 공유할 수 있습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제9조 (면책조항)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스는 천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임지지 않습니다.</li>
              <li>서비스는 이용자가 입력한 정보의 정확성을 보증하지 않으며, 이로 인한 진단 결과의 오차에 대해 책임지지 않습니다.</li>
              <li>서비스는 이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나 상실한 것에 대해 책임지지 않습니다.</li>
              <li>서비스는 이용자 간 또는 이용자와 제3자 간의 분쟁에 대해 개입하거나 책임지지 않습니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제10조 (서비스의 변경 및 중단)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>서비스는 운영상, 기술상의 필요에 따라 서비스의 전부 또는 일부를 변경할 수 있습니다.</li>
              <li>서비스의 내용, 이용 방법, 이용 시간에 대해 변경이 있는 경우 변경사항을 사전에 공지합니다.</li>
              <li>서비스는 무료로 제공되며, 향후 유료 서비스 도입 시 별도로 안내합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">제11조 (준거법 및 관할법원)</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이 약관의 해석 및 서비스 이용에 관한 분쟁은 대한민국 법령에 따릅니다.</li>
              <li>서비스와 이용자 간에 발생한 분쟁에 대해서는 대한민국 법원을 관할법원으로 합니다.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">부칙</h2>
            <p>이 약관은 2025년 2월 22일부터 시행합니다.</p>
          </section>

        </article>

        {/* 하단 */}
        <footer className="mt-12 pt-8 border-t border-neutral-200">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full h-[48px] rounded-[10px] bg-[#0F3D2E] hover:bg-[#0a2e22] text-white text-[15px] font-semibold transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </footer>
      </div>
    </div>
  );
}
