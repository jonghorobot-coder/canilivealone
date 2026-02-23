/**
 * 진단 히스토리 관리 유틸리티
 * 로컬스토리지에 최대 10개의 결과를 저장
 */

const HISTORY_KEY = 'diagnosis_history';
const FRIEND_SCORE_KEY = 'friend_score_to_compare';
const MAX_HISTORY = 10;

/**
 * 히스토리에 새 결과 추가
 * @param {object} result - 진단 결과
 * @returns {object} 저장된 히스토리 항목
 */
export function addToHistory(result) {
  const history = getHistory();

  const newEntry = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    score: result.score,
    grade: result.grade,
    categoryScores: result.categoryScores,
  };

  // 맨 앞에 추가하고 최대 개수 유지
  const updatedHistory = [newEntry, ...history].slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.warn('Failed to save history:', e);
  }

  return newEntry;
}

/**
 * 전체 히스토리 조회
 * @returns {Array} 히스토리 배열 (최신순)
 */
export function getHistory() {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Failed to load history:', e);
    return [];
  }
}

/**
 * 이전 결과와 현재 결과 비교
 * @param {number} currentScore - 현재 점수
 * @returns {object|null} { previousScore, diff, improved }
 */
export function compareWithPrevious(currentScore) {
  const history = getHistory();

  // 현재 결과 제외하고 이전 결과 찾기
  const previousEntry = history.find(entry => entry.score !== currentScore) || history[1];

  if (!previousEntry) {
    return null;
  }

  const diff = currentScore - previousEntry.score;

  return {
    previousScore: previousEntry.score,
    previousDate: previousEntry.date,
    diff,
    improved: diff > 0,
  };
}

/**
 * 친구 점수 저장 (공유 링크에서 진입 시)
 * @param {number} score - 친구 점수
 * @param {string} grade - 친구 등급
 */
export function saveFriendScore(score, grade) {
  try {
    localStorage.setItem(FRIEND_SCORE_KEY, JSON.stringify({
      score,
      grade,
      savedAt: Date.now(),
    }));
  } catch (e) {
    console.warn('Failed to save friend score:', e);
  }
}

/**
 * 저장된 친구 점수 조회 (24시간 이내만 유효)
 * @returns {object|null} { score, grade } or null
 */
export function getFriendScore() {
  try {
    const stored = localStorage.getItem(FRIEND_SCORE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);

    // 24시간 경과 시 만료
    const hoursPassed = (Date.now() - data.savedAt) / (1000 * 60 * 60);
    if (hoursPassed > 24) {
      localStorage.removeItem(FRIEND_SCORE_KEY);
      return null;
    }

    return { score: data.score, grade: data.grade };
  } catch (e) {
    console.warn('Failed to load friend score:', e);
    return null;
  }
}

/**
 * 친구 점수 삭제
 */
export function clearFriendScore() {
  localStorage.removeItem(FRIEND_SCORE_KEY);
}

/**
 * 히스토리 전체 삭제
 */
export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
