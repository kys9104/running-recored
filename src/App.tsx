import React, { useState, useEffect } from 'react';
import { ActiveTab, RunningRecord } from './types';
import { fetchAllRecords, subscribeToRecords, isFirebaseConfigured } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { RecordForm } from './components/RecordForm';
import { Leaderboard } from './components/Leaderboard';
import { GpsTracker } from './components/GpsTracker';
import { TrainingGuide } from './components/TrainingGuide';
import { AdminDashboard } from './components/AdminDashboard';
import { 
  Waves, 
  Sparkles, 
  Database, 
  MapPin, 
  HeartHandshake, 
  ShieldAlert 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('leaderboard');
  const [records, setRecords] = useState<RunningRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);

  // GPS 트래커 및 훈련 가이드에서 기록 등록 탭으로 전달할 측정 수치
  const [prefilledDistance, setPrefilledDistance] = useState<number | undefined>(undefined);
  const [prefilledSeconds, setPrefilledSeconds] = useState<number | undefined>(undefined);
  const [prefilledMemo, setPrefilledMemo] = useState<string | undefined>(undefined);

  // 훈련 가이드에서 GPS 탭으로 전달할 프리셋 프로그램
  const [gpsPresetProgram, setGpsPresetProgram] = useState<{
    title: string;
    targetDistanceKm: number;
    targetSeconds: number;
    memo: string;
  } | null>(null);

  // 데이터 로드 및 실시간 동기화
  const loadRecords = async () => {
    try {
      const data = await fetchAllRecords();
      setRecords(data);
    } catch (err) {
      console.error('기록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();

    // PC와 스마트폰 등 기기 간 실시간 자동 동기화 리스너 등록
    const unsubscribe = subscribeToRecords((updatedRecords) => {
      if (updatedRecords && updatedRecords.length > 0) {
        setRecords(updatedRecords);
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 신규 기록 제출 완료 시
  const handleRecordAdded = async (newRecord: RunningRecord) => {
    // 1) 즉시 로컬 상태에 반영하여 대시보드 탭 전환 시 바로 표시
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === newRecord.id);
      return exists ? prev : [newRecord, ...prev];
    });
    clearPrefilled();
    setActiveTab('leaderboard');

    // 2) 최신 데이터 원격/로컬 스토리지와 동기화
    try {
      const fresh = await fetchAllRecords();
      if (fresh && fresh.length > 0) {
        setRecords(fresh);
      }
    } catch (err) {
      console.warn('기록 동기화 중 오류:', err);
    }
  };

  // GPS 측정 완료 후 기록 등록 탭으로 내보내기
  const handleExportFromGps = (distKm: number, secs: number, memo?: string) => {
    setPrefilledDistance(distKm);
    setPrefilledSeconds(secs);
    setPrefilledMemo(memo);
    setActiveTab('record');
  };

  // 훈련 가이드에서 프로그램/스트레칭 완료 후 기록 등록 탭으로 바로 입력
  const handleApplyProgramToRecord = (distKm: number, secs: number, memo: string) => {
    setPrefilledDistance(distKm);
    setPrefilledSeconds(secs);
    setPrefilledMemo(memo);
    setActiveTab('record');
  };

  // 훈련 가이드에서 GPS 연동 모드로 시작
  const handleStartGpsWithProgram = (program: {
    title: string;
    targetDistanceKm: number;
    targetSeconds: number;
    memo: string;
  }) => {
    setGpsPresetProgram(program);
    setActiveTab('gps');
  };

  const clearPrefilled = () => {
    setPrefilledDistance(undefined);
    setPrefilledSeconds(undefined);
    setPrefilledMemo(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-600">
              신안해양과학고 사제동행 러닝 데이터를 불러오는 중...
            </p>
          </div>
        ) : (
          <>
            {/* 탭 1: 기록 등록 */}
            {activeTab === 'record' && (
              <RecordForm
                onSuccess={handleRecordAdded}
                prefilledDistance={prefilledDistance}
                prefilledSeconds={prefilledSeconds}
                prefilledMemo={prefilledMemo}
                clearPrefilled={clearPrefilled}
              />
            )}

            {/* 탭 2: 랭킹 및 통계 대시보드 */}
            {activeTab === 'leaderboard' && (
              <Leaderboard
                records={records}
                onNavigateToRecord={() => setActiveTab('record')}
              />
            )}

            {/* 탭 3: 실시간 GPS 러닝 메이트 */}
            {activeTab === 'gps' && (
              <GpsTracker 
                onExportToRecord={handleExportFromGps}
                presetProgram={gpsPresetProgram}
                onClearPresetProgram={() => setGpsPresetProgram(null)}
              />
            )}

            {/* 탭 4: 러닝 훈련 가이드 */}
            {activeTab === 'guide' && (
              <TrainingGuide 
                onApplyProgramToRecord={handleApplyProgramToRecord}
                onStartGpsWithProgram={handleStartGpsWithProgram}
              />
            )}

            {/* 탭 5: 체육교사 관리자 전용 대시보드 */}
            {activeTab === 'admin' && (
              <AdminDashboard
                records={records}
                onRecordUpdated={loadRecords}
                isAdminLoggedIn={isAdminLoggedIn}
                setIsAdminLoggedIn={setIsAdminLoggedIn}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto pb-20 md:pb-8 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-xs">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-sm block">
                  신안해양과학고등학교 사제동행 러닝(Running)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                {isFirebaseConfigured ? '클라우드 실시간 동기화 (PC 및 스마트폰 연동 중)' : '로컬 스토리지 모드'}
              </span>
              <span className="text-slate-400">|</span>
              <span className="flex items-center gap-1 text-slate-600">
                <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                교사와 학생이 함께 만드는 건강한 미래
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
