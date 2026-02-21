import { supabase } from '../lib/supabase';

/**
 * 결과를 익명으로 Supabase에 저장
 * 실패해도 UI에 영향 없음
 * @returns {Promise<string|null>} 저장된 결과의 id 또는 null
 */
export async function saveResultToServer(result) {
  // 이미 저장된 경우 중복 저장 방지
  const savedId = localStorage.getItem('result_saved_id');
  if (savedId) {
    return savedId;
  }

  try {
    const { data, error } = await supabase.from('results').insert({
      score: result.score,
      grade: result.grade,
      category_scores: result.categoryScores,
      income: result.income,
      monthly_required: result.monthlyRequired,
      safety_assets: result.safetyAssets,
      original_expenses: result.originalExpenses,
      housing_analysis: result.housingAnalysis,
      details: result.details,
    }).select('id').single();

    if (error) {
      console.warn('Result save failed:', error.message);
      return null;
    }

    // insert 성공 시 id 저장
    localStorage.setItem('result_saved_id', data.id);
    return data.id;
  } catch (err) {
    // 실패해도 무시 - UI 흐름에 영향 없음
    console.warn('Result save error:', err);
    return null;
  }
}

/**
 * ID로 결과 조회
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function fetchResultById(id) {
  try {
    const { data, error } = await supabase
      .from('results')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('Result fetch failed:', error.message);
      return null;
    }

    // DB 컬럼명을 클라이언트 형식으로 변환
    return {
      score: data.score,
      grade: data.grade,
      categoryScores: data.category_scores,
      income: data.income,
      monthlyRequired: data.monthly_required,
      safetyAssets: data.safety_assets,
      originalExpenses: data.original_expenses,
      housingAnalysis: data.housing_analysis,
      details: data.details,
    };
  } catch (err) {
    console.warn('Result fetch error:', err);
    return null;
  }
}
