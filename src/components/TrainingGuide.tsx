import React, { useState } from 'react';
import { 
  BookOpen, 
  Activity, 
  Flame, 
  Heart, 
  ShieldAlert, 
  Sparkles, 
  Wind, 
  Footprints, 
  CheckCircle2, 
  Calculator,
  Play,
  Save
} from 'lucide-react';
import { TrainingProgramConfig, TrainingSessionModal } from './TrainingSessionModal';

interface TrainingGuideProps {
  onApplyProgramToRecord: (distanceKm: number, seconds: number, memo: string) => void;
  onStartGpsWithProgram?: (program: {
    title: string;
    targetDistanceKm: number;
    targetSeconds: number;
    memo: string;
  }) => void;
}

const PRESET_PROGRAMS: Record<string, TrainingProgramConfig> = {
  walkRun: {
    id: 'walkRun',
    title: '1단계: 워킹 & 러닝 (Walk-Run)',
    badge: '초보자 / 기초 체력',
    defaultDistanceKm: 3.0,
    defaultMinutes: 25,
    description: '처음부터 무리하지 않고 걷기와 가벼운 조깅을 번갈아 실시하여 심폐와 관절을 단련합니다.',
    targetPaceDesc: "7'30\" ~ 8'30\" /km",
    dynamicStretches: [
      '고관절 회전 & 레그 스윙 (Leg Swings)',
      '하이 니 & 버트 킥 (High Knees & Butt Kicks)',
      '런지 & 상체 트위스트 (Walking Lunges)'
    ],
    staticStretches: [
      '종아리 비복근 & 아킬레스건 늘리기',
      '햄스트링 스트레칭',
      '엉덩이(둔근) 4자 스트레칭'
    ]
  },
  lsd: {
    id: 'lsd',
    title: '2단계: LSD (Long Slow Distance)',
    badge: '추천 ★ 사제동행 대화주',
    defaultDistanceKm: 5.0,
    defaultMinutes: 35,
    description: "'선생님과 옆에서 대화를 편안하게 나눌 수 있는 속도'로 30분 이상 천천히 길게 지속하는 지구력 훈련법입니다.",
    targetPaceDesc: "6'30\" ~ 7'30\" /km",
    dynamicStretches: [
      '고관절 회전 & 레그 스윙 (Leg Swings)',
      '하이 니 & 버트 킥 (High Knees & Butt Kicks)',
      '런지 & 상체 트위스트 (Walking Lunges)'
    ],
    staticStretches: [
      '종아리 비복근 & 아킬레스건 늘리기',
      '햄스트링 스트레칭',
      '허벅지 앞쪽 대퇴사두근 스트레칭',
      '엉덩이(둔근) 4자 스트레칭'
    ]
  },
  interval: {
    id: 'interval',
    title: '3단계: 인터벌 러닝 (Interval)',
    badge: '중·상급자 / 스피드 강화',
    defaultDistanceKm: 4.0,
    defaultMinutes: 22,
    description: '고강도 질주와 불완전 휴식을 교대로 실시하여 최대산소섭취량(VO2 Max)과 심폐 한계를 높입니다.',
    targetPaceDesc: "5'00\" ~ 5'30\" /km",
    dynamicStretches: [
      '고관절 회전 & 레그 스윙 (앞뒤/좌우 15회)',
      '하이 니 & 버트 킥 빠른 템포 20m',
      '런지 & 발목 가동성 스트레칭'
    ],
    staticStretches: [
      '종아리 비복근 & 아킬레스건 집중 이완',
      '햄스트링 깊은 스트레칭',
      '장요근 및 골반 전면 스트레칭',
      '엉덩이(둔근) 4자 스트레칭'
    ]
  }
};

export const TrainingGuide: React.FC<TrainingGuideProps> = ({
  onApplyProgramToRecord,
  onStartGpsWithProgram,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'programs' | 'stretch' | 'safety' | 'calculator'>('programs');

  // 모달 세션 상태
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgramConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // 목표 페이스 계산기 상태
  const [targetDistance, setTargetDistance] = useState<number>(5);
  const [targetMinutes, setTargetMinutes] = useState<number>(30);

  const calculatedPaceMin = targetDistance > 0 ? Math.floor(targetMinutes / targetDistance) : 0;
  const calculatedPaceSec = targetDistance > 0 ? Math.round(((targetMinutes / targetDistance) % 1) * 60) : 0;

  // 프로그램으로 세션 모달 열기
  const handleOpenProgramSession = (program: TrainingProgramConfig) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  // 프로그램으로 즉시 기록에 반영 (원클릭 저장)
  const handleDirectApply = (program: TrainingProgramConfig) => {
    const memo = `[${program.title}] 추천 프로그램 & 동적/정적 스트레칭 루틴 완주 (${program.defaultDistanceKm}km)`;
    onApplyProgramToRecord(
      program.defaultDistanceKm,
      program.defaultMinutes * 60,
      memo
    );
  };

  // 계산기 목표치로 세션 시작
  const handleOpenCalculatorSession = () => {
    const customConfig: TrainingProgramConfig = {
      id: 'calculator-custom',
      title: `목표 달성 러닝 (${targetDistance}km / ${targetMinutes}분)`,
      badge: '목표 페이스 훈련',
      defaultDistanceKm: targetDistance,
      defaultMinutes: targetMinutes,
      description: `계산된 목표 페이스 ${calculatedPaceMin}'${calculatedPaceSec.toString().padStart(2, '0')}"/km에 맞추어 달립니다.`,
      targetPaceDesc: `${calculatedPaceMin}'${calculatedPaceSec.toString().padStart(2, '0')}"/km`,
      dynamicStretches: [
        '고관절 회전 & 레그 스윙 (Leg Swings)',
        '하이 니 & 버트 킥 (High Knees & Butt Kicks)',
        '런지 & 상체 트위스트 (Walking Lunges)'
      ],
      staticStretches: [
        '종아리 비복근 & 아킬레스건 늘리기',
        '햄스트링 스트레칭',
        '엉덩이(둔근) 4자 스트레칭'
      ]
    };
    setSelectedProgram(customConfig);
    setIsModalOpen(true);
  };

  // 스트레칭 탭에서 동적+정적 스트레칭 세션 열기
  const handleOpenStretchingSession = () => {
    const stretchProgram: TrainingProgramConfig = {
      id: 'stretch-run',
      title: '동적 스트레칭 & 사제동행 조깅',
      badge: '스트레칭 완비 훈련',
      defaultDistanceKm: 3.5,
      defaultMinutes: 25,
      description: '부상 방지 동적 스트레칭을 꼼꼼히 마친 후 가벼운 조깅과 쿨다운을 완주합니다.',
      targetPaceDesc: "6'30\" ~ 7'30\" /km",
      dynamicStretches: [
        '1. 고관절 회전 & 레그 스윙 (15회)',
        '2. 하이 니 & 버트 킥 (20m 왕복)',
        '3. 런지 & 상체 트위스트 (10회)'
      ],
      staticStretches: [
        '1. 종아리 비복근 & 아킬레스건 늘리기 (20초)',
        '2. 햄스트링 스트레칭 (20초)',
        '3. 엉덩이(둔근) 4자 스트레칭 (20초)'
      ]
    };
    setSelectedProgram(stretchProgram);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-cyan-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-300/30 text-xs font-bold mb-3">
          <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
          신안해양과학고등학교 체육과 공식
        </div>
        <h2 className="text-2xl sm:text-3xl font-black">
          사제동행 러닝 훈련 가이드
        </h2>
        <p className="text-cyan-100/80 text-xs sm:text-sm mt-1 max-w-2xl">
          추천 훈련 프로그램과 스트레칭 루틴에 맞춰 러닝을 설정하고, 러닝 완료 후 [기록 저장하기]를 클릭하면 입력 탭에 즉시 자동 반영됩니다!
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveSubTab('programs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeSubTab === 'programs'
              ? 'bg-white text-blue-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-600" />
          <span>추천 훈련 프로그램</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stretch')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeSubTab === 'stretch'
              ? 'bg-white text-blue-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Footprints className="w-4 h-4 text-cyan-600" />
          <span>동적 스트레칭 & 쿨다운</span>
        </button>

        <button
          onClick={() => setActiveSubTab('safety')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeSubTab === 'safety'
              ? 'bg-white text-blue-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-cyan-600" />
          <span>부상 방지 & 호흡법</span>
        </button>

        <button
          onClick={() => setActiveSubTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeSubTab === 'calculator'
              ? 'bg-white text-blue-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-cyan-600" />
          <span>목표 페이스 계산기</span>
        </button>
      </div>

      {/* Sub-tab 1: Programs */}
      {activeSubTab === 'programs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-cyan-700 shrink-0" />
              <p className="text-xs text-cyan-900 font-medium">
                각 프로그램 카드의 <strong>[러닝 설정 & 시작]</strong>을 누르면 스트레칭 체크 및 타이머가 실행되며, 완주 후 <strong>[기록 저장하기]</strong>를 누르면 러닝 기록 탭에 거리, 시간, 코스메모가 바로 자동 입력됩니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: 걷기-달리기 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <Footprints className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {PRESET_PROGRAMS.walkRun.badge}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  {PRESET_PROGRAMS.walkRun.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {PRESET_PROGRAMS.walkRun.description}
                </p>
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>5분 빠른 걷기 웜업</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>2분 조깅 + 2분 걷기 (5세트 반복)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-800 font-bold pt-1 border-t border-slate-200">
                    <span>권장 설정:</span>
                    <span className="font-mono text-emerald-700">
                      {PRESET_PROGRAMS.walkRun.defaultDistanceKm}km / {PRESET_PROGRAMS.walkRun.defaultMinutes}분
                    </span>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenProgramSession(PRESET_PROGRAMS.walkRun)}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>이 훈련으로 러닝 설정 & 시작</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectApply(PRESET_PROGRAMS.walkRun)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-emerald-600" />
                  <span>완료 기록 즉시 저장</span>
                </button>
              </div>
            </div>

            {/* Card 2: LSD */}
            <div className="bg-white rounded-3xl p-6 border-2 border-cyan-400/80 shadow-md shadow-cyan-500/10 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center mb-4">
                  <Heart className="w-5 h-5 text-cyan-700" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-100 text-cyan-900 border border-cyan-200">
                  {PRESET_PROGRAMS.lsd.badge}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  {PRESET_PROGRAMS.lsd.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {PRESET_PROGRAMS.lsd.description}
                </p>
                <div className="mt-4 p-3.5 rounded-2xl bg-cyan-50/50 border border-cyan-200 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>페이스: 6'30" ~ 7'30" /km</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                    <span>시간: 30분 ~ 50분 지속주</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-900 font-bold pt-1 border-t border-cyan-200/80">
                    <span>권장 설정:</span>
                    <span className="font-mono text-cyan-800">
                      {PRESET_PROGRAMS.lsd.defaultDistanceKm}km / {PRESET_PROGRAMS.lsd.defaultMinutes}분
                    </span>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenProgramSession(PRESET_PROGRAMS.lsd)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>이 훈련으로 러닝 설정 & 시작</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectApply(PRESET_PROGRAMS.lsd)}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-50 hover:bg-cyan-100/70 text-cyan-900 border border-cyan-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-cyan-700" />
                  <span>완료 기록 즉시 저장</span>
                </button>
              </div>
            </div>

            {/* Card 3: 인터벌 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
              <div>
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 border border-orange-200">
                  {PRESET_PROGRAMS.interval.badge}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  {PRESET_PROGRAMS.interval.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {PRESET_PROGRAMS.interval.description}
                </p>
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>400m 질주 (목표 4'30"~5'00")</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                    <span>200m 가벼운 조깅 휴식 (4~6세트)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-800 font-bold pt-1 border-t border-slate-200">
                    <span>권장 설정:</span>
                    <span className="font-mono text-orange-700">
                      {PRESET_PROGRAMS.interval.defaultDistanceKm}km / {PRESET_PROGRAMS.interval.defaultMinutes}분
                    </span>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenProgramSession(PRESET_PROGRAMS.interval)}
                  className="w-full py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>이 훈련으로 러닝 설정 & 시작</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectApply(PRESET_PROGRAMS.interval)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-900 border border-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-orange-600" />
                  <span>완료 기록 즉시 저장</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Stretching & Cool-down */}
      {activeSubTab === 'stretch' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Footprints className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-blue-950">스트레칭 단계별 러닝 설정 모드</h4>
                <p className="text-xs text-blue-800">
                  달리기 전 동적 스트레칭과 달리기 후 정적 스트레칭을 체크하고 완주 기록을 한 번에 저장하세요.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenStretchingSession}
              className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer self-start sm:self-center shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>스트레칭 포함 러닝 설정하기</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pre-run Dynamic Stretching */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-600">달리기 전 (5~10분)</span>
                  <h3 className="text-base font-black text-slate-900">
                    동적 스트레칭 (Dynamic Warm-up)
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                관절을 멈추지 않고 계속 움직이며 체온을 올리고 관절 활액을 분비시킵니다.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900">1. 고관절 회전 & 레그 스윙 (Leg Swings)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    벽이나 펜스를 잡고 한쪽 다리를 앞뒤, 좌우로 부드럽게 15회 흔들어 고관절을 엽니다.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900">2. 하이 니 & 버트 킥 (High Knees & Butt Kicks)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    무릎을 골반 높이까지 가볍게 올리고, 발뒤꿈치로 엉덩이를 가볍게 차며 20m 왕복합니다.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900">3. 런지 & 트위스트 (Walking Lunges)</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    앞으로 크게 발을 디디며 상체를 회전시켜 대퇴사두근과 코어를 활성화합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Post-run Static Cool-down */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-cyan-600">달리기 후 (5~10분)</span>
                  <h3 className="text-base font-black text-slate-900">
                    정적 스트레칭 & 쿨다운 (Cool-down)
                  </h3>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                근육 길이를 정상으로 회복시키고 피로물질(젖산)을 배출하여 다음 날 근육통을 방지합니다.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900">1. 종아리 비복근 & 아킬레스건 늘리기</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    벽을 밀며 뒷다리 무릎을 곧게 펴고 발뒤꿈치를 바닥에 꾹 붙여 20초간 유지합니다.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900">2. 햄스트링 스트레칭</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    한쪽 다리를 벤치나 턱에 올리고 상체를 천천히 숙여 허벅지 뒷부분을 이완합니다.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-900">3. 엉덩이(둔근) 4자 스트레칭</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    벤치에 앉아 한쪽 발목을 반대편 무릎에 올리고 상체를 앞으로 기울여 엉덩이를 풉니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Safety & Shinan Marine Environment */}
      {activeSubTab === 'safety' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                부상 방지 핵심 수칙 & 신안 해양환경 주의점
              </h3>
              <p className="text-xs text-slate-500">
                안전이 최우선! 사제동행 러닝 시 반드시 지켜야 할 규칙
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h4 className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-cyan-600" />
                호흡법: 2-2 리듬 호흡
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                '발 두 걸음에 들이마시고(흡-흡), 다음 두 걸음에 내쉬는(후-후)' 규칙적인 리듬을 유지하세요. 복식 호흡으로 배를 불리며 산소 흡수율을 높입니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <h4 className="text-sm font-black text-blue-950 flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-cyan-600" />
                착지법: 미드풋 착지 & 케이던스 175
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                발뒤꿈치로 쿵쿵 찍지 않고 발바닥 중앙(미드풋)으로 가볍게 스치듯 착지합니다. 보폭을 줄이고 1분에 170~180보(케이던스)를 유지하면 무릎 충격을 50% 줄입니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-2">
              <h4 className="text-sm font-black text-cyan-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-700" />
                신안 해변/방조제 바닷바람(해풍) 대처
              </h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                신안 압해도 및 해안도로는 맞바람이 강할 수 있습니다. 상체를 앞으로 5도 살짝 기울이고 선생님과 교대로 바람막이 역할을 해주며 사제동행의 우애를 다집니다.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <h4 className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                야간 러닝 시 시인성 확보
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed">
                해 질 녘이나 저녁 러닝 시에는 반드시 밝은 형광색 운동복 또는 반사 밴드를 착용하고, 가로등이 잘 정비된 학교 운동장 트랙을 우선 이용합니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Calculator */}
      {activeSubTab === 'calculator' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                사제동행 목표 페이스 & 속도 계산기
              </h3>
              <p className="text-xs text-slate-500">
                목표 거리와 완주 희망 시간을 입력하면 필요한 페이스를 알려드립니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                목표 완주 거리 (km)
              </label>
              <div className="flex items-center gap-2">
                {[3, 5, 7, 10].map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setTargetDistance(km)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      targetDistance === km
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {km}km
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={targetDistance || ''}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setTargetDistance(0);
                  } else {
                    setTargetDistance(parseFloat(val) || 0);
                  }
                }}
                className="mt-3 w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                목표 완주 시간 (분)
              </label>
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={targetMinutes}
                onChange={(e) => setTargetMinutes(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-600 mb-2"
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>10분</span>
                <span className="font-extrabold text-blue-900 text-base font-mono">
                  {targetMinutes}분
                </span>
                <span>90분</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-cyan-200">목표 유지를 위한 1km당 페이스</span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-300 mt-1">
                {calculatedPaceMin}'{calculatedPaceSec.toString().padStart(2, '0')}" <span className="text-sm font-normal text-white">/km</span>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2">
              <div className="text-xs text-cyan-100/80 max-w-xs sm:text-right">
                {calculatedPaceMin < 5
                  ? '⚡ 상급자 페이스! 충분한 웜업 후 도전하세요.'
                  : calculatedPaceMin <= 6
                  ? '🏃 건강한 사제동행 지속주로 가장 이상적인 페이스입니다.'
                  : '🌱 초보자에게 안성맞춤인 대화 러닝 페이스입니다.'}
              </div>
              <button
                type="button"
                onClick={handleOpenCalculatorSession}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer mt-1"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>이 목표로 러닝 설정 & 시작하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 러닝 세션 및 스트레칭 인터랙티브 모달 */}
      {selectedProgram && (
        <TrainingSessionModal
          program={selectedProgram}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaveAndRecord={onApplyProgramToRecord}
          onStartGpsWithProgram={onStartGpsWithProgram}
        />
      )}
    </div>
  );
};
