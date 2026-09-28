import React, { useState, useEffect } from 'react';
import { 
  UserType, 
  StudentGrade, 
  StudentClass, 
  ContributedClass, 
  RunningRecord 
} from '../types';
import { calculatePace } from '../lib/runningUtils';
import { createRecord, uploadProofImage } from '../lib/firebase';
import { getStudentsByClass } from '../lib/studentRoster';
import { 
  PlusCircle, 
  User, 
  GraduationCap, 
  Calendar, 
  Clock, 
  Gauge, 
  Image as ImageIcon, 
  CheckCircle, 
  Upload, 
  Flame, 
  HeartHandshake, 
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';

interface RecordFormProps {
  onSuccess: (newRecord: RunningRecord) => void;
  prefilledDistance?: number;
  prefilledSeconds?: number;
  prefilledMemo?: string;
  clearPrefilled?: () => void;
}

export const RecordForm: React.FC<RecordFormProps> = ({
  onSuccess,
  prefilledDistance,
  prefilledSeconds,
  prefilledMemo,
  clearPrefilled,
}) => {
  const [userType, setUserType] = useState<UserType>('student');

  // 학생 입력 상태
  const [grade, setGrade] = useState<StudentGrade>('1학년');
  const [classNum, setClassNum] = useState<StudentClass>('1반');
  const [studentNo, setStudentNo] = useState<number>(1);
  const [name, setName] = useState<string>('곽승준');

  // 교사 입력 상태
  const [teacherName, setTeacherName] = useState<string>('');
  const [teacherRole, setTeacherRole] = useState<string>('');
  const [contributedClass, setContributedClass] = useState<ContributedClass>('1학년 1반');

  // 러닝 수치 입력 상태
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(() => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  });
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [hours, setHours] = useState<string>('0');
  const [minutes, setMinutes] = useState<string>('20');
  const [seconds, setSeconds] = useState<string>('0');
  const [memo, setMemo] = useState<string>('');

  // 사진 업로드 상태
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 로딩 및 안내 상태
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 학년/반 변경 시 학생 목록 불러와 자동 세팅
  const availableStudents = getStudentsByClass(grade, classNum);

  useEffect(() => {
    if (userType === 'student') {
      const currentInList = availableStudents.find((s) => s.studentNo === studentNo);
      if (currentInList) {
        setName(currentInList.name);
      } else if (availableStudents.length > 0) {
        setStudentNo(availableStudents[0].studentNo);
        setName(availableStudents[0].name);
      }
    }
  }, [grade, classNum]);

  // GPS 트래커 또는 훈련 가이드에서 넘겨받은 기록이 있는 경우 자동 채움
  useEffect(() => {
    if (prefilledDistance !== undefined && prefilledDistance > 0) {
      setDistanceKm(prefilledDistance.toFixed(2));
    }
    if (prefilledSeconds !== undefined && prefilledSeconds > 0) {
      const h = Math.floor(prefilledSeconds / 3600);
      const m = Math.floor((prefilledSeconds % 3600) / 60);
      const s = prefilledSeconds % 60;
      setHours(h.toString());
      setMinutes(m.toString());
      setSeconds(s.toString());
    }
    if (prefilledMemo !== undefined && prefilledMemo.trim().length > 0) {
      setMemo(prefilledMemo);
    }
  }, [prefilledDistance, prefilledSeconds, prefilledMemo]);

  // 초 단위 총 소요 시간 계산
  const totalSeconds =
    (parseInt(hours || '0', 10) || 0) * 3600 +
    (parseInt(minutes || '0', 10) || 0) * 60 +
    (parseInt(seconds || '0', 10) || 0);

  const numericDistance = parseFloat(distanceKm) || 0;
  const realTimePace = calculatePace(numericDistance, totalSeconds);

  // 학생 번호 및 성명 선택 시 통합 처리
  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const num = parseInt(e.target.value, 10);
    setStudentNo(num);
    const target = availableStudents.find((s) => s.studentNo === num);
    if (target) {
      setName(target.name);
    }
  };

  // 이미지 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (userType === 'student' && !name.trim()) {
      setErrorMsg('학생 성명을 확인해주세요.');
      return;
    }
    if (userType === 'teacher' && !teacherName.trim()) {
      setErrorMsg('선생님 성함을 입력해주세요.');
      return;
    }
    if (numericDistance <= 0) {
      setErrorMsg('러닝 거리(km)를 올바르게 입력해주세요 (0보다 커야 함).');
      return;
    }
    if (totalSeconds <= 0) {
      setErrorMsg('소요 시간을 입력해주세요.');
      return;
    }
    if (!imageFile) {
      setErrorMsg('러닝 인증 사진(스마트워치 또는 러닝 앱 측정 화면 캡처)을 반드시 첨부해야 합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl = '';
      if (imageFile) {
        uploadedImageUrl = await uploadProofImage(imageFile);
      }

      const finalRecord = await createRecord({
        userType,
        name: userType === 'student' ? name.trim() : teacherName.trim(),
        grade: userType === 'student' ? grade : undefined,
        classNum: userType === 'student' ? classNum : undefined,
        studentNo: userType === 'student' ? studentNo : undefined,
        teacherRole: userType === 'teacher' ? teacherRole.trim() : undefined,
        contributedClass: userType === 'teacher' ? contributedClass : undefined,
        date,
        time,
        distanceKm: Number(numericDistance.toFixed(2)),
        durationSeconds: totalSeconds,
        pace: realTimePace,
        memo: memo.trim(),
        imageUrl: uploadedImageUrl,
      });

      setSuccessMsg('러닝 기록이 성공적으로 등록되었습니다! 반별 랭킹에 즉시 반영됩니다.');
      if (clearPrefilled) clearPrefilled();

      // 리셋 및 부모 알림 (랭킹 대시보드로 자동 이동)
      setTimeout(() => {
        setIsSubmitting(false);
        setDistanceKm('');
        setHours('0');
        setMinutes('20');
        setSeconds('0');
        setMemo('');
        setImageFile(null);
        setImagePreview(null);
        setSuccessMsg(null);
        onSuccess(finalRecord);
      }, 800);
    } catch (err: any) {
      console.error('기록 저장 실패:', err);
      setErrorMsg('기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Page Title Card */}
      <div className="bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 text-xs font-semibold mb-3">
            <Flame className="w-3.5 h-3.5 text-cyan-300" />
            신안의 바다를 가르는 사제동행 마일리지
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            오늘의 러닝 기록 등록
          </h2>
          <p className="text-cyan-100/80 text-sm mt-1">
            선생님과 학생이 함께 뛰고 누적하는 건강한 학교 만들기! 달린 거리와 시간을 입력하세요.
          </p>
        </div>
      </div>

      {/* 훈련 가이드 / GPS 자동 채움 안내 알림 */}
      {(prefilledDistance !== undefined || prefilledSeconds !== undefined || prefilledMemo) && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 border border-cyan-200/90 text-cyan-950 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-cyan-100" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-cyan-950">
                훈련 가이드 / GPS 러닝 데이터가 자동 입력되었습니다
              </h4>
              <p className="text-xs text-cyan-800">
                거리 <strong className="text-cyan-950 font-mono font-bold">{distanceKm || prefilledDistance}km</strong>, 소요시간 <strong className="text-cyan-950 font-mono font-bold">{hours}시간 {minutes}분 {seconds}초</strong>, 코스메모가 폼에 자동 세팅되었습니다.
              </p>
              <p className="text-[11px] text-cyan-700 font-medium">
                아래 1단계(학생 또는 교사 정보) 확인 후 최하단의 <strong>[러닝 기록 등록하기]</strong> 버튼을 누르면 저장이 완료됩니다.
              </p>
            </div>
          </div>
          {clearPrefilled && (
            <button
              type="button"
              onClick={clearPrefilled}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-cyan-200 text-xs font-bold text-cyan-800 hover:bg-cyan-100/70 transition-colors shrink-0"
              title="자동 입력 초기화"
            >
              초기화
            </button>
          )}
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
        {/* Step 1: User Type Selector Tabs */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            1. 등록 구분 선택 (학생 / 교사)
          </label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setUserType('student')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                userType === 'student'
                  ? 'bg-white text-blue-900 shadow-md shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className={`w-5 h-5 ${userType === 'student' ? 'text-cyan-600' : 'text-slate-400'}`} />
              <span>학생 (Student)</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType('teacher')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                userType === 'teacher'
                  ? 'bg-white text-blue-900 shadow-md shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className={`w-5 h-5 ${userType === 'teacher' ? 'text-cyan-600' : 'text-slate-400'}`} />
              <span>선생님 (Teacher)</span>
            </button>
          </div>
        </div>

        {/* Step 2-A: Student Fields */}
        {userType === 'student' && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-cyan-50/70 border border-blue-100 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-600 text-white flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" /> 신안해양과학고 학생 정보
              </span>
              <span className="text-xs text-slate-500">1·2학년 명단 연동 완료</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 학년 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">학년</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value as StudentGrade)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="1학년">1학년</option>
                  <option value="2학년">2학년</option>
                </select>
              </div>

              {/* 반 */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">반</label>
                <select
                  value={classNum}
                  onChange={(e) => setClassNum(e.target.value as StudentClass)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="1반">1반</option>
                  <option value="2반">2반</option>
                </select>
              </div>

              {/* 번호 및 성명 통합 */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-600 mb-1">학생 (번호 / 성명)</label>
                <select
                  value={studentNo}
                  onChange={handleStudentSelect}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {availableStudents.map((s) => (
                    <option key={s.studentNo} value={s.studentNo}>
                      {s.studentNo}번 {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2-B: Teacher Fields & Contributed Class Feature */}
        {userType === 'teacher' && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50/80 to-cyan-50/80 border border-amber-200/80 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-600 text-white flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5" /> 선생님 사제동행 정보
              </span>
              <span className="text-xs text-amber-800 font-medium">선생님의 땀방울이 학생들의 반 마일리지로 이어집니다!</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  선생님 성함 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="선생님 성함 입력"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  담당 과목 / 보직
                </label>
                <input
                  type="text"
                  placeholder="담당 과목 또는 보직 입력"
                  value={teacherRole}
                  onChange={(e) => setTeacherRole(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* 핵심: 교사의 기여할 학급 선택 드롭다운 */}
            <div className="mt-3 p-4 rounded-xl bg-white border-2 border-cyan-400/80 shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <HeartHandshake className="w-5 h-5 text-cyan-600" />
                <label className="block text-sm font-extrabold text-cyan-950">
                  내 러닝 기록을 누적 합산할 학급 선택 (필수/핵심)
                </label>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                선택하신 학급의 <strong>'반별 총 누적 거리(km)'</strong>에 선생님의 기록이 즉시 합산되어 대항전 순위에 기여합니다.
              </p>
              <select
                value={contributedClass}
                onChange={(e) => setContributedClass(e.target.value as ContributedClass)}
                className="w-full bg-cyan-50/50 border border-cyan-300 rounded-xl px-4 py-2.5 text-sm font-extrabold text-blue-950 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="1학년 1반">🏆 1학년 1반 (선생님 기록을 1학년 1반에 기여)</option>
                <option value="1학년 2반">🏆 1학년 2반 (선생님 기록을 1학년 2반에 기여)</option>
                <option value="2학년 1반">🏆 2학년 1반 (선생님 기록을 2학년 1반에 기여)</option>
                <option value="2학년 2반">🏆 2학년 2반 (선생님 기록을 2학년 2반에 기여)</option>
                <option value="none">기여하지 않음 (개인 일지로만 보관)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Running Details (Date, Distance, Time, Live Pace) */}
        <div className="space-y-4 pt-2">
          <label className="block text-sm font-bold text-slate-700">
            2. 러닝 데이터 입력
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 날짜 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                러닝 날짜
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
                required
              />
            </div>

            {/* 시간 */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                출발 시간
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 뛴 거리 (km) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                뛴 거리 (km 단위) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="예: 4.50"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-base font-extrabold text-blue-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 pr-12"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  km
                </span>
              </div>
            </div>

            {/* 소요 시간 (시 / 분 / 초) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                소요 시간 (시 / 분 / 초) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 block text-center mt-0.5">시간</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 block text-center mt-0.5">분</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400 block text-center mt-0.5">초</span>
                </div>
              </div>
            </div>
          </div>

          {/* 실시간 페이스 자동 계산 디스플레이 */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-cyan-200/80 block">실시간 계산 페이스</span>
                <span className="text-xs text-slate-400">거리와 시간 입력 시 즉시 산출</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black tracking-tight text-cyan-300 font-mono">
                {realTimePace}
              </span>
              <span className="text-xs text-slate-300 ml-1">/km</span>
            </div>
          </div>

          {/* 한 줄 코스메모 */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              코스메모 (선택)
            </label>
            <input
              type="text"
              placeholder="예: 압해도 송공산 둘레길 러닝, 숨찼지만 기분 최고!"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              maxLength={150}
            />
          </div>

          {/* 증빙 자료 첨부 (스마트워치 / 러닝앱 캡처 사진) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-cyan-600" />
                러닝 인증 사진 첨부 <span className="text-rose-500 font-extrabold">* (필수 제출)</span>
              </span>
              <span className="text-[11px] text-slate-400">스마트워치 / 러닝앱 화면 필수</span>
            </label>

            {!imagePreview ? (
              <label className="border-2 border-dashed border-cyan-300 hover:border-cyan-500 bg-cyan-50/30 hover:bg-cyan-50/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-cyan-600" />
                </div>
                <span className="text-sm font-bold text-slate-800 group-hover:text-cyan-900 flex items-center gap-1">
                  러닝 인증 사진 선택 또는 드래그 <span className="text-rose-500 font-extrabold">*</span>
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  스마트워치 측정 화면 또는 러닝 앱 기록 캡처본 (JPG, PNG, WEBP 등 지원)
                </span>
                <span className="text-[11px] text-cyan-800 font-semibold mt-1 bg-cyan-100/70 px-2.5 py-0.5 rounded-full">
                  ※ 정직한 사제동행 마일리지 누적을 위해 인증 사진 첨부는 필수입니다.
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-400/80 bg-slate-100 max-h-60 flex items-center justify-center group shadow-xs">
                <img
                  src={imagePreview}
                  alt="인증 사진 미리보기"
                  className="object-contain max-h-60 w-full"
                />
                <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
                  <CheckCircle className="w-3.5 h-3.5" />
                  인증 사진 첨부 완료
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  title="사진 삭제 및 변경"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 hover:from-cyan-500 hover:to-indigo-600 text-white font-extrabold text-base shadow-lg shadow-cyan-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>기록 등록 및 반별 점수 집계 중...</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              <span>러닝 기록 최종 제출하기</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
