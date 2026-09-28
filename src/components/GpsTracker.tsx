import React, { useState, useEffect, useRef } from 'react';
import { haversineDistance, calculatePace, formatSeconds } from '../lib/runningUtils';
import { 
  Play, 
  Pause, 
  Square, 
  Send, 
  MapPin, 
  Navigation, 
  Gauge, 
  Clock, 
  RefreshCw, 
  Compass, 
  Radio, 
  Activity,
  Sparkles
} from 'lucide-react';

interface GpsTrackerProps {
  onExportToRecord: (distanceKm: number, seconds: number, memo?: string) => void;
  presetProgram?: {
    title: string;
    targetDistanceKm: number;
    targetSeconds: number;
    memo: string;
  } | null;
  onClearPresetProgram?: () => void;
}

interface Coordinate {
  lat: number;
  lng: number;
  timestamp: number;
}

export const GpsTracker: React.FC<GpsTrackerProps> = ({ 
  onExportToRecord,
  presetProgram,
  onClearPresetProgram
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [currentPace, setCurrentPace] = useState<string>("-'--\"");
  
  // GPS 좌표 추적
  const [coordsList, setCoordsList] = useState<Coordinate[]>([]);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('GPS 대기 중');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const simulationTimerRef = useRef<number | null>(null);

  // 스톱워치 타이머
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerIdRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    }
    return () => {
      if (timerIdRef.current) clearInterval(timerIdRef.current);
    };
  }, [isRunning, isPaused]);

  // 실시간 페이스 갱신
  useEffect(() => {
    if (distanceKm > 0.05 && elapsedSeconds > 0) {
      setCurrentPace(calculatePace(distanceKm, elapsedSeconds));
    }
  }, [distanceKm, elapsedSeconds]);

  // GPS 위치 업데이트 처리기
  const handleLocationUpdate = (lat: number, lng: number, accuracy?: number) => {
    if (accuracy !== undefined) {
      setCurrentAccuracy(Math.round(accuracy));
    }

    setCoordsList((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const stepDist = haversineDistance(last.lat, last.lng, lat, lng);
        // 너무 튀는 이상치(GPS 노이즈: 1초당 50m 초과 등) 또는 극소 변화(<1m) 필터링
        if (stepDist >= 0.002 && stepDist <= 0.05) {
          setDistanceKm((d) => Number((d + stepDist).toFixed(3)));
          return [...prev, { lat, lng, timestamp: Date.now() }];
        }
        return prev;
      } else {
        return [{ lat, lng, timestamp: Date.now() }];
      }
    });
  };

  // 실내/PC 테스트용 가상 시뮬레이션 이동 (신안해양과학고 트랙 좌표)
  useEffect(() => {
    if (isRunning && !isPaused && isSimulating) {
      // 신안해양과학고 주변(압해도) 기준 가상 좌표
      let angle = 0;
      const centerLat = 34.8285;
      const centerLng = 126.3650;
      const radius = 0.0015; // 트랙 반경 약 150m

      simulationTimerRef.current = window.setInterval(() => {
        angle += 0.05;
        const simLat = centerLat + radius * Math.cos(angle) + (Math.random() - 0.5) * 0.0001;
        const simLng = centerLng + radius * Math.sin(angle) * 1.3 + (Math.random() - 0.5) * 0.0001;
        handleLocationUpdate(simLat, simLng, 5);
        setGpsStatus('신안 운동장 트랙 가상 주행 중 (정확도 ±5m)');
      }, 1000);
    } else {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }
    }
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, [isRunning, isPaused, isSimulating]);

  // 실제 브라우저 Geolocation API 추적
  const startRealGpsTracking = () => {
    if (!navigator.geolocation) {
      setGpsStatus('브라우저가 GPS 위치정보를 지원하지 않습니다.');
      return;
    }

    setGpsStatus('GPS 위성 신호 수신 중...');
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGpsStatus(`GPS 연결 정상 (오차 ±${Math.round(accuracy)}m)`);
          handleLocationUpdate(latitude, longitude, accuracy);
        },
        (error) => {
          console.warn('GPS 수신 에러:', error);
          setGpsStatus(`GPS 오류: ${error.message}. 실내 시뮬레이션 모드를 켜서 테스트할 수 있습니다.`);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
    } catch (e) {
      console.error(e);
      setGpsStatus('GPS 접근 권한이 차단되었습니다.');
    }
  };

  const stopGpsTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // 시작 버튼
  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    if (!isSimulating) {
      startRealGpsTracking();
    }
  };

  // 일시정지 버튼
  const handlePause = () => {
    setIsPaused(true);
    stopGpsTracking();
  };

  // 재개 버튼
  const handleResume = () => {
    setIsPaused(false);
    if (!isSimulating) {
      startRealGpsTracking();
    }
  };

  // 종료 버튼
  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    stopGpsTracking();
    setGpsStatus('러닝이 완료되었습니다. 기록을 등록해보세요!');
  };

  // 초기화 버튼
  const handleReset = () => {
    handleStop();
    setElapsedSeconds(0);
    setDistanceKm(0);
    setCurrentPace("-'--\"");
    setCoordsList([]);
    setCurrentAccuracy(null);
    setGpsStatus('새로운 러닝 준비 완료');
  };

  // 기록 등록 탭으로 내보내기
  const handleExport = () => {
    const exportMemo = presetProgram 
      ? `[${presetProgram.title}] GPS 실시간 트래커 완주 (${Number(distanceKm.toFixed(2))}km)`
      : `GPS 실시간 트래커 완주 코스 (${Number(distanceKm.toFixed(2))}km)`;
    onExportToRecord(Number(distanceKm.toFixed(2)), elapsedSeconds, exportMemo);
  };

  // 순수 SVG 궤적 경로 생성 (외부 유료 지도 API 불필요)
  const renderSvgPath = () => {
    if (coordsList.length < 2) {
      return (
        <div className="h-44 sm:h-56 flex flex-col items-center justify-center text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-700/50 p-4">
          <Navigation className="w-8 h-8 text-cyan-400 animate-bounce mb-2" />
          <p className="text-xs font-semibold text-slate-300">
            {isRunning ? '이동하는 동안 GPS 궤적이 실시간으로 그려집니다...' : '러닝 시작 버튼을 눌러 GPS 측정을 시작하세요.'}
          </p>
          <span className="text-[11px] text-slate-500 mt-1">
            신안해양과학고 운동장 및 해안도로 전파 수신 최적화
          </span>
        </div>
      );
    }

    const lats = coordsList.map((c) => c.lat);
    const lngs = coordsList.map((c) => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const latRange = maxLat - minLat || 0.0001;
    const lngRange = maxLng - minLng || 0.0001;

    // SVG 뷰박스 크기: 400 x 200
    const padding = 25;
    const width = 400;
    const height = 200;

    const points = coordsList.map((c) => {
      const x = padding + ((c.lng - minLng) / lngRange) * (width - padding * 2);
      // y축 반전 (위도가 높을수록 위쪽)
      const y = height - padding - ((c.lat - minLat) / latRange) * (height - padding * 2);
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(' L ')}`;
    const startPoint = points[0].split(',');
    const currentPoint = points[points.length - 1].split(',');

    return (
      <div className="relative h-48 sm:h-60 bg-slate-950 rounded-2xl border border-cyan-500/30 overflow-hidden shadow-inner flex items-center justify-center">
        {/* Radar Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full relative z-10 p-2">
          {/* 궤적 선로 */}
          <path
            d={pathData}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          />

          {/* 시작점 (초록 핀) */}
          <circle cx={startPoint[0]} cy={startPoint[1]} r="5" fill="#10b981" />
          <text x={Number(startPoint[0]) + 7} y={Number(startPoint[1]) + 4} fill="#a7f3d0" fontSize="10" fontWeight="bold">
            START
          </text>

          {/* 현재점 (네온 펄스) */}
          <circle cx={currentPoint[0]} cy={currentPoint[1]} r="6" fill="#38bdf8" className="animate-ping opacity-75" />
          <circle cx={currentPoint[0]} cy={currentPoint[1]} r="5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
          <text x={Number(currentPoint[0]) + 7} y={Number(currentPoint[1]) + 4} fill="#bae6fd" fontSize="10" fontWeight="bold">
            NOW
          </text>
        </svg>

        {/* GPS Point Counter */}
        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-cyan-300 font-mono border border-cyan-500/30">
          좌표 {coordsList.length}개 누적
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Title Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-cyan-500/30">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            웹 표준 GPS 실시간 트래커
          </div>

          {/* 시뮬레이션 모드 스위치 (실내/PC 테스트 지원) */}
          <button
            type="button"
            onClick={() => {
              if (!isRunning) setIsSimulating(!isSimulating);
            }}
            disabled={isRunning}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
              isSimulating
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isSimulating ? '가상 러닝 테스트 ON' : '실내 테스트 모드'}
          </button>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black mt-3">
          실시간 GPS 러닝 메이트
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          스마트폰 브라우저 GPS로 거리와 페이스를 실시간 자동 측정하고, 완료 시 바로 기록 등록으로 전송합니다.
        </p>
      </div>

      {/* 훈련 가이드 연동 모드 활성화 알림 */}
      {presetProgram && (
        <div className="p-4 rounded-3xl bg-cyan-50 border border-cyan-200 text-cyan-950 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-700 shrink-0" />
            <div>
              <span className="text-[11px] font-bold text-cyan-700">훈련 가이드 목표 연동 모드</span>
              <h4 className="text-xs font-black text-cyan-950">
                {presetProgram.title} (목표: {presetProgram.targetDistanceKm}km)
              </h4>
            </div>
          </div>
          {onClearPresetProgram && (
            <button
              type="button"
              onClick={onClearPresetProgram}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
            >
              해제
            </button>
          )}
        </div>
      )}

      {/* Main Live Dashboard Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        {/* Big Stopwatch Display */}
        <div className="text-center py-4 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 shadow-inner">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center justify-center gap-1 mb-1">
            <Clock className="w-3.5 h-3.5" /> 경과 시간
          </span>
          <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-white">
            {formatSeconds(elapsedSeconds, true)}
          </div>
        </div>

        {/* Real-time Metrics (Distance & Pace) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Distance */}
          <div className="p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200 text-center">
            <span className="text-xs font-bold text-cyan-800 block mb-1">측정 거리</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl sm:text-4xl font-black text-cyan-950 font-mono">
                {distanceKm.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-cyan-700">km</span>
            </div>
          </div>

          {/* Pace */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
            <span className="text-xs font-bold text-blue-800 block mb-1">실시간 페이스</span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl sm:text-4xl font-black text-blue-950 font-mono">
                {currentPace}
              </span>
              <span className="text-xs font-bold text-blue-700">/km</span>
            </div>
          </div>
        </div>

        {/* GPS Live Route Visualizer (Pure SVG) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Compass className="w-4 h-4 text-cyan-600" />
              실시간 GPS 이동 궤적 (Haversine 계산)
            </span>
            <span className="text-slate-400 font-mono">
              {currentAccuracy !== null ? `정확도 ±${currentAccuracy}m` : '위성 탐색'}
            </span>
          </div>

          {renderSvgPath()}

          {/* GPS Status Message Bar */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-medium text-slate-600 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
            <span className="truncate">{gpsStatus}</span>
          </div>
        </div>

        {/* Controls: Start / Pause / Resume / Stop */}
        <div className="space-y-3 pt-2">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-lg shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white" />
              <span>러닝 시작하기</span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {!isPaused ? (
                <button
                  onClick={handlePause}
                  className="py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-base shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Pause className="w-5 h-5 fill-white" />
                  <span>일시정지</span>
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>이어서 달리기</span>
                </button>
              )}

              <button
                onClick={handleStop}
                className="py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-base shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Square className="w-5 h-5 fill-white" />
                <span>러닝 종료</span>
              </button>
            </div>
          )}

          {/* Export to Record Form Button (Active when distance or time > 0) */}
          {distanceKm > 0 || elapsedSeconds > 0 ? (
            <div className="pt-2 flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-extrabold text-sm shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>기록 등록 탭으로 내보내기 ({distanceKm.toFixed(2)}km)</span>
              </button>

              <button
                onClick={handleReset}
                title="기록 초기화"
                className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
