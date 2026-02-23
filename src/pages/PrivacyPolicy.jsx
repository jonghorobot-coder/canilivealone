import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
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
            개인정보 처리방침
          </h1>
          <p className="text-[14px] text-neutral-400 mt-2">
            최종 수정일: 2025년 2월 22일
          </p>
        </header>

        {/* 본문 */}
        <article className="space-y-8 text-[15px] text-neutral-700 leading-relaxed">

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">1. 개인정보의 처리 목적</h2>
            <p>
              독립점수(이하 "서비스")는 다음의 목적을 위하여 개인정보를 처리합니다.
              처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며,
              이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>재무 독립 가능성 진단 서비스 제공</li>
              <li>진단 결과 저장 및 공유 링크 생성</li>
              <li>서비스 이용 통계 분석 및 개선</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">2. 수집하는 개인정보 항목</h2>
            <p>서비스는 다음과 같은 정보를 수집합니다:</p>
            <div className="bg-neutral-50 rounded-lg p-4 mt-3">
              <p className="font-semibold text-neutral-800 mb-2">진단 정보 (필수)</p>
              <ul className="list-disc pl-5 space-y-1 text-[14px]">
                <li>월 수입 금액</li>
                <li>카테고리별 월 지출 금액 (주거비, 식비, 교통비, 여가비, 고정지출, 저축 등)</li>
                <li>주거 형태 및 재정 상황 관련 설문 응답</li>
              </ul>
            </div>
            <div className="bg-neutral-50 rounded-lg p-4 mt-3">
              <p className="font-semibold text-neutral-800 mb-2">자동 수집 정보</p>
              <ul className="list-disc pl-5 space-y-1 text-[14px]">
                <li>서비스 이용 기록 (Google Analytics)</li>
                <li>접속 시간, 페이지 조회 기록</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">3. 개인정보의 처리 및 보유 기간</h2>
            <p>
              서비스는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를
              수집 시에 동의받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li><span className="font-medium">진단 결과 데이터:</span> 공유 링크 생성일로부터 1년</li>
              <li><span className="font-medium">서비스 이용 기록:</span> 수집일로부터 1년</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">4. 개인정보의 제3자 제공</h2>
            <p>
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 아래의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">5. 개인정보 처리의 위탁</h2>
            <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다:</p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-[14px] border-collapse">
                <thead>
                  <tr className="bg-neutral-100">
                    <th className="border border-neutral-200 px-4 py-2 text-left font-semibold">수탁업체</th>
                    <th className="border border-neutral-200 px-4 py-2 text-left font-semibold">위탁업무 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-neutral-200 px-4 py-2">Supabase Inc.</td>
                    <td className="border border-neutral-200 px-4 py-2">진단 결과 데이터 저장 및 관리</td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-200 px-4 py-2">Google LLC</td>
                    <td className="border border-neutral-200 px-4 py-2">서비스 이용 통계 분석 (Google Analytics)</td>
                  </tr>
                  <tr>
                    <td className="border border-neutral-200 px-4 py-2">Vercel Inc.</td>
                    <td className="border border-neutral-200 px-4 py-2">웹사이트 호스팅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">6. 정보주체의 권리·의무 및 행사방법</h2>
            <p>이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>개인정보 열람 요구</li>
              <li>오류 등이 있을 경우 정정 요구</li>
              <li>삭제 요구</li>
              <li>처리 정지 요구</li>
            </ul>
            <p className="mt-3">
              위 권리 행사는 서비스에 대해 서면, 전자우편 등을 통하여 하실 수 있으며
              서비스는 이에 대해 지체 없이 조치하겠습니다.
            </p>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">7. 개인정보의 파기</h2>
            <p>
              서비스는 개인정보 보유기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는
              지체 없이 해당 개인정보를 파기합니다.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li><span className="font-medium">전자적 파일:</span> 복구 및 재생이 불가능하도록 영구 삭제</li>
              <li><span className="font-medium">기타 기록물:</span> 분쇄 또는 소각</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">8. 개인정보의 안전성 확보 조치</h2>
            <p>서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>개인정보의 암호화 (HTTPS/TLS 통신)</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>개인정보 접근 제한</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">9. 개인정보 보호책임자</h2>
            <div className="bg-[#E8F3EF] rounded-lg p-4">
              <p className="font-semibold text-[#0F3D2E] mb-2">개인정보 보호책임자</p>
              <ul className="text-[14px] space-y-1">
                <li>서비스명: 독립점수</li>
                <li>이메일: canilivealone.help@gmail.com</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-[18px] font-bold text-neutral-900 mb-3">10. 개인정보 처리방침 변경</h2>
            <p>
              이 개인정보 처리방침은 2025년 2월 22일부터 적용됩니다.
              법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </section>

        </article>

        {/* 하단 */}
        <footer className="mt-12 pt-8 border-t border-neutral-100">
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
