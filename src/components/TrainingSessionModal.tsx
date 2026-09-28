import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Heart, 
  Footprints, 
  Save, 
  MapPin, 
  Clock, 
  Gauge, 
  X, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { calculatePace, formatSeconds } from '../lib/runningUtils';

export interface TrainingProgramConfig {
  id: string;
  title: string;
  badge: string;
  defaultDistanceKm: number;
  defaultMinutes: number;
  description: string;
  targetPaceDesc: string;
  dynamicStretches: string[];
  staticStretches: string[];
}

interface TrainingSessionModalProps {
  program: TrainingProgramConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaveAndRecord: (distanceKm: number, seconds: number, memo: string) => void;
  onStartGpsWithProgram?: (program: {
    title: string;
    targetDistanceKm: number;
    targetSeconds: number;
    memo: string;
  }) => void;
}

export const TrainingSessionModal: React.FC<TrainingSessionModalProps> = ({
  program,
  isOpen,
  onClose,
  onSaveAndRecord,
  onStartGpsWithProgram,
}) => {
  // 러닝 목표 설정 상태
  const [distanceKm, setDistanceKm] = useState<number>(program.defaultDistanceKm);
  const [targetMinutes, setTargetMinutes] = useState<number>(program.defaultMinutes);

  // 스트레칭 체크리스트 상태
  const [completedDynamic, setCompletedDynamic] = useState<Record<string, boolean>>({});
  const [completedStatic, setCompletedStatic] = useState<Record<string, boolean>>({});

  // 실시간 러닝 스톱워치 상태
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // 프로그램 변경 시 초기화
  useEffect(() => {
    setDistanceKm(program.defaultDistanceKm);
    setTargetMinutes(program.defaultMinutes);
    setCompletedDynamic({});
    setCompletedStatic({});
    setElapsedSeconds(0);
    setIsRunning(false);
  }, [program]);

  // 스톱워치 타이머
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  if (!isOpen) return null;

  // 동적 스트레칭 토글
  const toggleDynamic = (item: string) => {
    setCompletedDynamic((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  // 정적 스트레칭 토글
  const toggleStatic = (item: string) => {
    setCompletedStatic((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  // 전체 동적 스트레칭 완료
  const checkAllDynamic = () => {
    const allDone: Record<string, boolean> = {};
    program.dynamicStretches.forEach((item) => {
      allDone[item] = true;
    });
    setCompletedDynamic(allDone);
  };

  // 전체 정적 스트레칭 완료
  const checkAllStatic = () => {
    const allDone: Record<string, boolean> = {};
    program.staticStretches.forEach((item) => {
      allDone[item] = true;
    });
    setCompletedStatic(allDone);
  };

  const dynamicCount = program.dynamicStretches.filter((item) => completedDynamic[item]).length;
  const staticCount = program.staticStretches.filter((item) => completedStatic[item]).length;

  const targetTotalSeconds = targetMinutes * 60;
  // 러닝 시간 결정: 스톱워치가 10초 이상 돌았으면 실제 시간 사용, 아니면 설정된 목표 시간 적용
  const finalSeconds = elapsedSeconds >= 10 ? elapsedSeconds : targetTotalSeconds;
  const calculatedPace = calculatePace(distanceKm, finalSeconds);

  // 저장하기 핸들러
  const handleCompleteAndSave = () => {
    // 코스메모 자동 작성
    const dynamicDoneText =
      dynamicCount === program.dynamicStretches.length
        ? '동적 스트레칭 전체 완료'
        : dynamicCount > 0
        ? `동적 스트레칭(${dynamicCount}/${program.dynamicStretches.length}종)`
        : '스트레칭 미체크';

    const staticDoneText =
      staticCount === program.staticStretches.length
        ? '쿨다운 정적 스트레칭 완료'
        : staticCount > 0
        ? `쿨다운 스트레칭(${staticCount}/${program.staticStretches.length}종)`
        : '';

    const stretchSummary = [dynamicDoneText, staticDoneText].filter(Boolean).join(' · ');

    const memo = `[${program.title}] ${stretchSummary} / ${distanceKm}km 완주 (${calculatedPace}/km)`;

    onSaveAndRecord(distanceKm, finalSeconds, memo);
    onClose();
  };

  // GPS 트래커로 연동 시작
  const handleLaunchGps = () => {
    if (onStartGpsWithProgram) {
      const dynamicDoneText =
        dynamicCount === program.dynamicStretches.length
          ? '동적 스트레칭 완료'
          : dynamicCount > 0
          ? `동적 스트레칭 ${dynamicCount}종 완료`
          : '동적 스트레칭';

      const memo = `[${program.title}] ${dynamicDoneText} 후 실시간 GPS 러닝 완주`;
      onStartGpsWithProgram({
        title: program.title,
        targetDistanceKm: distanceKm,
        targetSeconds: targetMinutes * 60,
        memo,
      });
      onClose();
    }
  };

  // 진행률 계산 (스톱워치 기준 또는 목표시간 대비)
  const progressPercent = Math.min(
    100,
    Math.round((elapsedSeconds / (targetMinutes * 60)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* 모달 상단 헤더 */}
        <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 text-white rounded-t-3xl relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            {program.badge}
          </div>
          <h2 className="text-xl sm:text-2xl font-black">{program.title} 러닝 세션</h2>
          <p className="text-xs text-cyan-100/80 mt-1">{program.description}</p>
        </div>

        {/* 모달 본문 */}
        <div className="p-6 space-y-6 flex-1">
          {/* 1. 목표 거리 & 시간 러닝 설정 카드 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-600" />
                러닝 훈련 목표 설정
              </span>
              <span className="text-[11px] text-cyan-700 font-bold bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200">
                권장 페이스: {program.targetPaceDesc}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* 거리 설정 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  목표 달리기 거리 (km)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="42.195"
                    value={distanceKm || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setDistanceKm(0);
                      } else {
                        setDistanceKm(parseFloat(val) || 0);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-blue-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="flex gap-1">
                    {[3, 5, 7].map((km) => (
                      <button
                        key={km}
                        type="button"
                        onClick={() => setDistanceKm(km)}
                        className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition-colors ${
                          distanceKm === km
                            ? 'bg-blue-900 text-white border-blue-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {km}k
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 목표 시간 설정 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  목표 완주 시간 (분)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={targetMinutes || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setTargetMinutes(0);
                      } else {
                        setTargetMinutes(parseInt(val, 10) || 0);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-extrabold text-blue-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="flex gap-1">
                    {[20, 30, 45].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTargetMinutes(m)}
                        className={`px-2 py-2 rounded-lg text-[11px] font-bold border transition-colors ${
                          targetMinutes === m
                            ? 'bg-blue-900 text-white border-blue-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m}분
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 예상 페이스 표시 */}
            <div className="flex items-center justify-between text-xs pt-1 text-slate-500 border-t border-slate-200/60">
              <span>목표 환산 평균 페이스:</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {calculatePace(distanceKm, targetMinutes * 60)} /km
              </span>
            </div>
          </div>

          {/* 2. 스트레칭 1단계: 달리기 전 동적 스트레칭 (Dynamic Warm-up) */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                  1
                </div>
                <span className="text-xs font-black text-blue-950">
                  달리기 전 동적 스트레칭 (Dynamic Warm-up)
                </span>
              </div>
              <button
                type="button"
                onClick={checkAllDynamic}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded-lg border border-blue-200"
              >
                전체 완료 체크
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              관절을 회전하고 체온을 높여 부상을 예방합니다. 아래 추천 스트레칭을 실시하세요:
            </p>

            <div className="space-y-2">
              {program.dynamicStretches.map((item, idx) => {
                const isChecked = !!completedDynamic[item];
                return (
                  <button
                    key={`dyn-${idx}`}
                    type="button"
                    onClick={() => toggleDynamic(item)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      isChecked
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-cyan-200 shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span>{item}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${isChecked ? 'text-cyan-200' : 'text-slate-400'}`}>
                      {isChecked ? '완료' : '탭하여 체크'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 본 러닝 세션 (스톱워치 & GPS 트래킹 옵션) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-black">
                  2
                </div>
                <span className="text-xs font-black text-cyan-200">
                  본 러닝 세션 (Running Session)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                목표 {distanceKm}km ({targetMinutes}분)
              </span>
            </div>

            {/* 타이머 디스플레이 */}
            <div className="text-center py-2">
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-wider text-cyan-300">
                {formatSeconds(elapsedSeconds > 0 ? elapsedSeconds : targetMinutes * 60)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                {elapsedSeconds > 0 ? '실시간 측정 중 (초 단위 반영)' : '설정된 목표 시간 (스톱워치 시작 가능)'}
              </span>
            </div>

            {/* 진행률 바 */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>시간 진행률</span>
                <span className="font-mono text-cyan-300 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 제어 버튼 */}
            <div className="flex items-center gap-2 pt-1">
              {!isRunning ? (
                <button
                  type="button"
                  onClick={() => setIsRunning(true)}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>스톱워치 러닝 시작</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRunning(false)}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Pause className="w-4 h-4 fill-slate-950" />
                  <span>일시정지</span>
                </button>
              )}

              {elapsedSeconds > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRunning(false);
                    setElapsedSeconds(0);
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="리셋"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}

              {onStartGpsWithProgram && (
                <button
                  type="button"
                  onClick={handleLaunchGps}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  <span>GPS 맵에서 추적하기</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. 스트레칭 2단계: 달리기 후 쿨다운 정적 스트레칭 */}
          <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-600 text-white flex items-center justify-center text-xs font-black">
                  3
                </div>
                <span className="text-xs font-black text-cyan-950">
                  달리기 후 정적 스트레칭 & 쿨다운 (Cool-down)
                </span>
              </div>
              <button
                type="button"
                onClick={checkAllStatic}
                className="text-[11px] font-bold text-cyan-800 hover:text-cyan-950 bg-white px-2 py-0.5 rounded-lg border border-cyan-200"
              >
                전체 완료 체크
              </button>
            </div>

            <p className="text-[11px] text-slate-600">
              달리기 후 근육의 긴장을 풀고 젖산 배출을 도와 피로를 줄입니다:
            </p>

            <div className="space-y-2">
              {program.staticStretches.map((item, idx) => {
                const isChecked = !!completedStatic[item];
                return (
                  <button
                    key={`stat-${idx}`}
                    type="button"
                    onClick={() => toggleStatic(item)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      isChecked
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-cyan-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      <span>{item}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${isChecked ? 'text-white' : 'text-slate-400'}`}>
                      {isChecked ? '완료' : '탭하여 체크'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 모달 하단 고정 액션 바 */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            <span className="font-bold text-blue-950">등록 예정:</span>{' '}
            <span className="font-mono font-bold text-cyan-700">{distanceKm}km</span> /{' '}
            <span className="font-mono font-bold text-slate-800">
              {formatSeconds(finalSeconds)}
            </span>{' '}
            <span className="text-[11px] text-slate-400">
              (동적 {dynamicCount}개, 쿨다운 {staticCount}개 체크됨)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleCompleteAndSave}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>러닝 완료 및 기록 저장하기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
