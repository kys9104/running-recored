import React, { useState, useMemo } from 'react';
import { RunningRecord } from '../types';
import { aggregateClassStats, formatSeconds } from '../lib/runningUtils';
import { MonthlyClassChart } from './MonthlyClassChart';
import { 
  Trophy, 
  Medal, 
  Flame, 
  Users, 
  HeartHandshake, 
  Search, 
  Filter, 
  Maximize2, 
  X, 
  Calendar, 
  Clock, 
  Gauge, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface LeaderboardProps {
  records: RunningRecord[];
  onNavigateToRecord?: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  records,
  onNavigateToRecord,
}) => {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // 4개 학급별 학생 + 교사 기여 합산 통계 집계
  const classStats = useMemo(() => {
    const stats = aggregateClassStats(records);
    // 총 누적 거리 기준 내림차순 정렬 (랭킹 순)
    return [...stats].sort((a, b) => b.totalKm - a.totalKm);
  }, [records]);

  // 전체 통계 요약
  const grandTotalKm = useMemo(() => {
    return Number(records.reduce((acc, r) => acc + (Number(r.distanceKm) || 0), 0).toFixed(1));
  }, [records]);

  const grandTotalRuns = records.length;

  // 학급 목표치 (예: 100km 기준 또는 최대값 기준)
  const maxTotalKm = Math.max(...classStats.map((c) => c.totalKm), 30);

  // 개인별 일지 필터링 및 최신순 정렬
  const filteredRecords = useMemo(() => {
    const list = records.filter((rec) => {
      // 학급 필터
      if (selectedClassFilter === 'teacher') {
        if (rec.userType !== 'teacher') return false;
      } else if (selectedClassFilter !== 'all') {
        if (rec.userType === 'student') {
          const studentClass = `${rec.grade} ${rec.classNum}`;
          if (studentClass !== selectedClassFilter) return false;
        } else if (rec.userType === 'teacher') {
          if (rec.contributedClass !== selectedClassFilter) return false;
        }
      }

      // 검색어 필터
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = rec.name.toLowerCase().includes(query);
        const matchesMemo = (rec.memo || '').toLowerCase().includes(query);
        return matchesName || matchesMemo;
      }

      return true;
    });

    // 최신 등록 순으로 정렬 (새로 등록된 데이터가 대시보드 최상단에 바로 반영)
    return [...list].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(`${a.date}T${a.time || '00:00'}`).getTime();
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(`${b.date}T${b.time || '00:00'}`).getTime();
      return timeB - timeA;
    });
  }, [records, selectedClassFilter, searchQuery]);

  // 랭킹 뱃지 스타일
  const getRankBadge = (rank: number) => {
    if (rank === 0) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-md shadow-amber-400/30">
          <Trophy className="w-3.5 h-3.5 fill-amber-950" /> 1위 (챔피언)
        </span>
      );
    }
    if (rank === 1) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-300 text-slate-900 font-bold text-xs shadow-xs">
          <Medal className="w-3.5 h-3.5 text-slate-700" /> 2위
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-700/80 text-amber-50 font-bold text-xs shadow-xs">
          <Medal className="w-3.5 h-3.5" /> 3위
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-bold text-xs">
        4위
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Hero Banner with Stats Overview */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 text-white p-6 sm:p-10 shadow-xl border border-cyan-500/20">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-400/20 via-blue-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              신안해양과학고등학교 사제동행 러닝 마일리지 대시보드
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              함께 뛴 거리, 함께 빛나는 학급! 🏃‍♂️💨
            </h2>
            <p className="text-cyan-100/90 text-sm sm:text-base mt-2 max-w-xl">
              학생과 교사가 한마음으로 누적한 러닝 거리입니다. 선생님의 러닝은 지정된 반에 자동 합산되어 단체전 순위에 반영됩니다.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15">
            <div className="text-center px-3 border-r border-white/20">
              <span className="text-xs text-cyan-200 font-medium block">학교 총 누적 거리</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                {grandTotalKm}
              </span>
              <span className="text-xs text-cyan-200 ml-1">km</span>
            </div>
            <div className="text-center px-3">
              <span className="text-xs text-cyan-200 font-medium block">총 완주 횟수</span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                {grandTotalRuns}
              </span>
              <span className="text-xs text-cyan-200 ml-1">회</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: 반별 누적 현황 (단체전 대항전) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              학급별 사제동행 누적 거리 랭킹 (단체전)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              각 반의 기록은 <strong>'학생 기록 + 담임/체육선생님이 기여한 기록'</strong>이 통합 합산됩니다.
            </p>
          </div>
          {onNavigateToRecord && (
            <button
              onClick={onNavigateToRecord}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all self-start sm:self-auto cursor-pointer"
            >
              <span>우리 반 기록 보태기</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 4개 반 랭킹 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {classStats.map((item, index) => {
            const percentage = Math.min(100, Math.round((item.totalKm / maxTotalKm) * 100));
            const isFirst = index === 0;

            return (
              <div
                key={item.className}
                className={`relative rounded-3xl p-5 sm:p-6 transition-all duration-300 border ${
                  isFirst
                    ? 'bg-gradient-to-br from-amber-500/10 via-white to-cyan-50/60 border-amber-300 shadow-lg shadow-amber-500/10 ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${
                        isFirst
                          ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.className.slice(0, 1)}-{item.className.slice(4, 5)}
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-900">
                        {item.className}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Users className="w-3 h-3" /> 총 {item.totalRuns}회 완주
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>{getRankBadge(index)}</div>
                </div>

                {/* Main Mileage Metric */}
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 block">총 누적 마일리지</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-mono text-blue-950">
                        {item.totalKm}
                      </span>
                      <span className="text-sm font-bold text-slate-600">km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200 inline-block">
                      기여도 {percentage}%
                    </span>
                  </div>
                </div>

                {/* Interactive Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/80 mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isFirst
                        ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-cyan-500'
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600'
                    }`}
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  />
                </div>

                {/* Detail Breakdown Badge: Student vs Teacher Contribution */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      학생 누적 ({item.studentRuns}회):
                    </span>
                    <span className="font-extrabold text-blue-900 font-mono">
                      {item.studentKm} km
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60">
                    <span className="text-slate-600 flex items-center gap-1 font-medium">
                      <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                      선생님 기여 합산 ({item.teacherRuns}회):
                    </span>
                    <span className="font-extrabold text-rose-600 font-mono">
                      +{item.teacherKm} km
                    </span>
                  </div>

                  {item.contributingTeachers.length > 0 && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-cyan-800 bg-cyan-100/50 px-2 py-1 rounded-md">
                      <Sparkles className="w-3 h-3 text-cyan-600 shrink-0" />
                      <span className="truncate">
                        함께 달린 교사: {item.contributingTeachers.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: 반별 누적 거리 추이 시각화 (Recharts 막대 그래프) */}
      <MonthlyClassChart records={records} />

      {/* SECTION 3: 개인별 & 선생님별 러닝 일지 피드 */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500" />
              사제동행 개별 러닝 일지 피드
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              학생과 교사가 올린 생생한 러닝 인증과 기록을 확인하세요.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Class Filter */}
            <div className="relative">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-8"
              >
                <option value="all">전체 학급 & 교사</option>
                <option value="1학년 1반">1학년 1반</option>
                <option value="1학년 2반">1학년 2반</option>
                <option value="2학년 1반">2학년 1반</option>
                <option value="2학년 2반">2학년 2반</option>
                <option value="teacher">선생님 기록만</option>
              </select>
            </div>

            {/* Name Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="이름/코스메모 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 w-36 sm:w-44"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Record Cards Grid */}
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold">조건에 맞는 러닝 기록이 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">필터를 변경하거나 첫 기록을 남겨보세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRecords.map((rec) => {
              const isTeacher = rec.userType === 'teacher';

              return (
                <div
                  key={rec.id}
                  className={`rounded-3xl p-5 border flex flex-col justify-between transition-all duration-200 bg-white hover:shadow-lg ${
                    isTeacher
                      ? 'border-amber-200/90 shadow-sm ring-1 ring-amber-300/30'
                      : 'border-slate-200/80 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header: User Info & Tag */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                              isTeacher
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-blue-100 text-blue-900 border border-blue-200'
                            }`}
                          >
                            {isTeacher ? '선생님' : `${rec.grade} ${rec.classNum}`}
                          </span>
                          {!isTeacher && rec.studentNo && (
                            <span className="text-[11px] text-slate-500 font-semibold">
                              {rec.studentNo}번
                            </span>
                          )}
                          {rec.createdAt && (Date.now() - new Date(rec.createdAt).getTime() < 1000 * 60 * 15) && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-cyan-100 text-cyan-800 border border-cyan-300 animate-pulse flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-cyan-600" />
                              방금 등록됨
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-slate-900 mt-1">
                          {rec.name}
                        </h4>
                        {isTeacher && rec.teacherRole && (
                          <span className="text-[11px] text-slate-500 block">
                            {rec.teacherRole}
                          </span>
                        )}
                      </div>

                      <div className="text-right text-[11px] text-slate-400 font-medium flex flex-col items-end">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {rec.date}
                        </span>
                        {rec.time && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-2.5 h-2.5" />
                            {rec.time}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Teacher Contributed Class Highlight Badge */}
                    {isTeacher && (
                      <div className="mb-3 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-900 font-bold flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          {rec.contributedClass && rec.contributedClass !== 'none'
                            ? `기여: ${rec.contributedClass}에 +${rec.distanceKm}km 적립!`
                            : '개인 훈련 기록'}
                        </span>
                      </div>
                    )}

                    {/* Running Metrics Row */}
                    <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-slate-50 border border-slate-200/60 mb-3 text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 block">달린 거리</span>
                        <span className="text-base font-black text-blue-900 font-mono">
                          {rec.distanceKm}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-0.5">km</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">소요 시간</span>
                        <span className="text-xs font-bold text-slate-800 font-mono block mt-1">
                          {formatSeconds(rec.durationSeconds, false)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">페이스</span>
                        <span className="text-xs font-bold text-cyan-700 font-mono block mt-1">
                          {rec.pace}
                        </span>
                      </div>
                    </div>

                    {/* Memo / Feeling */}
                    {rec.memo && (
                      <p className="text-xs text-slate-700 bg-cyan-50/30 p-2.5 rounded-xl border border-cyan-100/50 mb-3 line-clamp-2">
                        "{rec.memo}"
                      </p>
                    )}
                  </div>

                  {/* Proof Photo Thumbnail */}
                  {rec.imageUrl && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div
                        onClick={() => setZoomedImage(rec.imageUrl!)}
                        className="relative rounded-xl overflow-hidden h-36 bg-slate-100 cursor-pointer group border border-slate-200"
                      >
                        <img
                          src={rec.imageUrl}
                          alt="인증 사진"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <Maximize2 className="w-4 h-4" />
                          <span>사진 확대</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Modal for Proof Photos */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div 
            className="relative max-w-3xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImage}
              alt="확대된 인증 사진"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
