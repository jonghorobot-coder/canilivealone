/**
 * 관리자 페이지 - 프리미엄 리포트 관리
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { generateReportPdf, previewReportHTML } from '../utils/generatePdf';

export function AdminPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

  // 간단한 비밀번호 인증
  const ADMIN_PASSWORD = 'canilivealone2026';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('admin_auth', 'true');
    } else {
      alert('비밀번호가 틀립니다.');
    }
  };

  useEffect(() => {
    if (localStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // 요청 목록 로드
  useEffect(() => {
    if (!isAuthenticated) return;

    async function loadRequests() {
      setLoading(true);
      const { data, error } = await supabase
        .from('premium_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading requests:', error);
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    }

    loadRequests();
  }, [isAuthenticated]);

  // 결과 데이터 가져오기
  const fetchResultData = async (resultId) => {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('id', resultId)
      .single();

    if (error) {
      console.error('Error fetching result:', error);
      return null;
    }
    return data;
  };

  // PDF 생성
  const handleGeneratePdf = async (request) => {
    setGenerating(request.id);

    try {
      const resultData = await fetchResultData(request.result_id);

      if (!resultData) {
        alert('결과 데이터를 찾을 수 없습니다.');
        return;
      }

      // result 객체 구성
      const result = {
        score: resultData.score,
        grade: resultData.grade,
        categoryScores: resultData.category_scores,
        income: resultData.income,
        originalExpenses: resultData.total_expenses,
        details: resultData.details,
      };

      // expenses 객체 구성 (저장된 데이터에서 추출)
      const expenses = resultData.category_scores ? {
        housing: Math.round(resultData.income * 0.3), // 추정값
        food: Math.round(resultData.income * 0.15),
        fixed: Math.round(resultData.income * 0.1),
        transport: Math.round(resultData.income * 0.08),
        leisure: Math.round(resultData.income * 0.1),
        misc: Math.round(resultData.income * 0.05),
        savings: Math.round(resultData.income * 0.1),
      } : {};

      await generateReportPdf(result, resultData.income, expenses, 25, request.email);

      // 상태 업데이트
      await supabase
        .from('premium_requests')
        .update({ status: 'generated' })
        .eq('id', request.id);

      // 목록 새로고침
      setRequests(prev =>
        prev.map(r => r.id === request.id ? { ...r, status: 'generated' } : r)
      );

      alert('PDF가 생성되었습니다. 다운로드 폴더를 확인하세요.');
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성에 실패했습니다.');
    } finally {
      setGenerating(null);
    }
  };

  // HTML 미리보기
  const handlePreview = async (request) => {
    try {
      const resultData = await fetchResultData(request.result_id);

      if (!resultData) {
        alert('결과 데이터를 찾을 수 없습니다.');
        return;
      }

      const result = {
        score: resultData.score,
        grade: resultData.grade,
        categoryScores: resultData.category_scores,
        income: resultData.income,
        originalExpenses: resultData.total_expenses,
        details: resultData.details,
      };

      const expenses = {
        housing: Math.round(resultData.income * 0.3),
        food: Math.round(resultData.income * 0.15),
        fixed: Math.round(resultData.income * 0.1),
        transport: Math.round(resultData.income * 0.08),
        leisure: Math.round(resultData.income * 0.1),
        misc: Math.round(resultData.income * 0.05),
        savings: Math.round(resultData.income * 0.1),
      };

      previewReportHTML(result, resultData.income, expenses, 25, request.email);
    } catch (error) {
      console.error('미리보기 오류:', error);
      alert('미리보기에 실패했습니다.');
    }
  };

  // 상태 업데이트
  const handleStatusUpdate = async (id, newStatus) => {
    const { error } = await supabase
      .from('premium_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Status update error:', error);
      alert('상태 업데이트에 실패했습니다.');
    } else {
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
      );
    }
  };

  // 로그인 화면
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
          <h1 className="text-xl font-bold text-center mb-6">관리자 로그인</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full h-12 px-4 border border-gray-200 rounded-lg mb-4"
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
          <button
            onClick={handleLogin}
            className="w-full h-12 bg-[#0F3D2E] text-white rounded-lg font-semibold"
          >
            로그인
          </button>
        </div>
      </div>
    );
  }

  // 상태별 색상
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'generated':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return '결제 대기';
      case 'paid':
        return '결제 완료';
      case 'generated':
        return 'PDF 생성됨';
      case 'sent':
        return '발송 완료';
      case 'cancelled':
        return '취소됨';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">프리미엄 리포트 관리</h1>
          <button
            onClick={() => {
              localStorage.removeItem('admin_auth');
              setIsAuthenticated(false);
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-6xl mx-auto p-6">
        {/* 통계 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">전체 요청</p>
            <p className="text-2xl font-bold">{requests.filter(r => r.status !== 'cancelled').length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">결제 대기</p>
            <p className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">결제 완료</p>
            <p className="text-2xl font-bold text-blue-600">
              {requests.filter(r => r.status === 'paid').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">발송 완료</p>
            <p className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'sent').length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-sm text-gray-500">취소됨</p>
            <p className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === 'cancelled').length}
            </p>
          </div>
        </div>

        {/* 요청 목록 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold">요청 목록</h2>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="rounded"
              />
              취소된 항목 보기
            </label>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">로딩 중...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">아직 요청이 없습니다.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">점수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등급</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.filter(r => showCancelled || r.status !== 'cancelled').map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{request.email}</td>
                    <td className="px-6 py-4 text-sm font-semibold">{request.score}점</td>
                    <td className="px-6 py-4 text-sm">{request.grade}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusStyle(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'paid')}
                              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              결제 확인
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'cancelled')}
                              className="px-3 py-1 text-xs bg-red-400 text-white rounded hover:bg-red-500"
                            >
                              취소
                            </button>
                          </>
                        )}
                        {request.status === 'paid' && (
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'pending')}
                            className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            ↩ 대기로
                          </button>
                        )}
                        {(request.status === 'paid' || request.status === 'pending') && (
                          <>
                            <button
                              onClick={() => handlePreview(request)}
                              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              미리보기
                            </button>
                            <button
                              onClick={() => handleGeneratePdf(request)}
                              disabled={generating === request.id}
                              className="px-3 py-1 text-xs bg-[#0F3D2E] text-white rounded hover:bg-[#0a2e22] disabled:opacity-50"
                            >
                              {generating === request.id ? '열는 중...' : 'PDF 인쇄'}
                            </button>
                          </>
                        )}
                        {request.status === 'generated' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'paid')}
                              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                              ↩ 결제로
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(request.id, 'sent')}
                              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              발송 완료
                            </button>
                          </>
                        )}
                        {request.status === 'sent' && (
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'generated')}
                            className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            ↩ 되돌리기
                          </button>
                        )}
                        {request.status === 'cancelled' && (
                          <button
                            onClick={() => handleStatusUpdate(request.id, 'pending')}
                            className="px-3 py-1 text-xs bg-blue-400 text-white rounded hover:bg-blue-500"
                          >
                            ↩ 복구
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
