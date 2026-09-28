import React, { useState, useMemo } from 'react';
import { RunningRecord, ContributedClass } from '../types';
import { exportRecordsToCSV, formatSeconds, calculatePace } from '../lib/runningUtils';
import { updateRecord, deleteRecord, deleteAllRecords } from '../lib/firebase';
import { 
  ShieldCheck, 
  Download, 
  Edit3, 
  Trash2, 
  Search, 
  LogOut, 
  Lock, 
  Check, 
  X, 
  AlertTriangle, 
  Filter, 
  FileSpreadsheet, 
  Users, 
  Sparkles,
  HeartHandshake
} from 'lucide-react';

interface AdminDashboardProps {
  records: RunningRecord[];
  onRecordUpdated: () => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  records,
  onRecordUpdated,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
}) => {
  // 인증 폼 상태
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // 테이블 검색 및 필터 상태
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'student' | 'teacher'>('all');

  // 수정(Edit) 모달 상태
  const [editingRecord, setEditingRecord] = useState<RunningRecord | null>(null);
  const [editDistance, setEditDistance] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editMemo, setEditMemo] = useState<string>('');
  const [editContributedClass, setEditContributedClass] = useState<ContributedClass>('none');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // 삭제(Delete) 확인 모달 상태
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 전체 삭제(Bulk Delete) 확인 모달 상태
  const [isConfirmingBulkDelete, setIsConfirmingBulkDelete] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  // 비밀번호 인증 핸들러 (비밀번호: 4161)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '4161') {
      setIsAdminLoggedIn(true);
      setAuthError(null);
      setPasswordInput('');
    } else {
      setAuthError('관리자 비밀번호가 일치하지 않습니다. 다시 입력해주세요.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
  };

  // 필터링된 기록
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterType !== 'all' && r.userType !== filterType) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(q);
        const matchesMemo = (r.memo || '').toLowerCase().includes(q);
        const matchesRole = (r.teacherRole || '').toLowerCase().includes(q);
        const matchesClass = `${r.grade || ''} ${r.classNum || ''}`.toLowerCase().includes(q);
        return matchesName || matchesMemo || matchesRole || matchesClass;
      }
      return true;
    });
  }, [records, filterType, searchTerm]);

  // 수정 모달 열기
  const openEditModal = (rec: RunningRecord) => {
    setEditingRecord(rec);
    setEditDistance(rec.distanceKm.toString());
    setEditDate(rec.date);
    setEditMemo(rec.memo || '');
    setEditContributedClass(rec.contributedClass || 'none');
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingRecord) return;
    const numDist = parseFloat(editDistance);
    if (isNaN(numDist) || numDist <= 0) {
      alert('올바른 거리를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const newPace = calculatePace(numDist, editingRecord.durationSeconds);
      await updateRecord(editingRecord.id, {
        distanceKm: Number(numDist.toFixed(2)),
        date: editDate,
        memo: editMemo,
        contributedClass: editContributedClass,
        pace: newPace,
      });

      onRecordUpdated();
      setEditingRecord(null);
    } catch (err) {
      console.error(err);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제 확정
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteRecord(deletingId);
      onRecordUpdated();
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 전체 기록 일괄 삭제 (초기화)
  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await deleteAllRecords();
      onRecordUpdated();
      setIsConfirmingBulkDelete(false);
    } catch (err) {
      console.error(err);
      alert('전체 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // 1. 미인증 상태: 비밀번호(4161) 입력 모달
  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/80 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">
            체육교사 관리자 전용 모드
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            사제동행 러닝 기록 관리 및 데이터 내보내기를 위해 4자리 관리자 비밀번호를 입력하세요.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              maxLength={10}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
              autoFocus
            />
          </div>

          {authError && (
            <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {authError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-sm shadow-md shadow-blue-900/20 cursor-pointer transition-all"
          >
            관리자 대시보드 로그인
          </button>
        </form>

        <div className="text-[11px] text-slate-400">
          안내: 인가된 체육교사만 접근 가능합니다.
        </div>
      </div>
    );
  }

  // 2. 인증 성공 상태: 관리자 대시보드
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Admin Top Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-cyan-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            체육교사 관리자 인증됨
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            신안해양과학고 사제동행 관리자 뷰
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            전체 학생 및 교사의 러닝 데이터를 통합 검토하고, 수정/삭제 및 엑셀(CSV) 다운로드를 수행합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* CSV Download Button */}
          <button
            onClick={() => exportRecordsToCSV(records)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>엑셀(CSV) 전체 다운로드</span>
          </button>

          {/* 전체 기록 일괄 삭제 (초기화) 버튼 */}
          <button
            onClick={() => setIsConfirmingBulkDelete(true)}
            disabled={records.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 disabled:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-900/30 transition-all cursor-pointer"
            title="기록 예시안 및 등록 데이터를 전체 초기화합니다"
          >
            <Trash2 className="w-4 h-4" />
            <span>전체 기록 일괄 삭제 (초기화)</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">총 등록 건수</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {records.length} <span className="text-xs font-normal text-slate-500">건</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">학생 제출 기록</span>
          <div className="text-2xl font-black text-blue-900 font-mono mt-1">
            {records.filter((r) => r.userType === 'student').length} <span className="text-xs font-normal text-slate-500">건</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">선생님 기여 기록</span>
          <div className="text-2xl font-black text-amber-800 font-mono mt-1">
            {records.filter((r) => r.userType === 'teacher').length} <span className="text-xs font-normal text-slate-500">건</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium">총 러닝 거리 합계</span>
          <div className="text-2xl font-black text-cyan-900 font-mono mt-1">
            {records.reduce((acc, r) => acc + (Number(r.distanceKm) || 0), 0).toFixed(1)}{' '}
            <span className="text-xs font-normal text-slate-500">km</span>
          </div>
        </div>
      </div>

      {/* Table Card with Filter & Search */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Filter Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-900">
              전체 제출 목록 ({filteredRecords.length}건)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* User Type Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'all' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setFilterType('student')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'student' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                학생
              </button>
              <button
                onClick={() => setFilterType('teacher')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filterType === 'teacher' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                교사
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="이름, 학급, 소감 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">구분</th>
                <th className="py-3 px-4">이름</th>
                <th className="py-3 px-4">소속 / 기여학급</th>
                <th className="py-3 px-4">날짜</th>
                <th className="py-3 px-4 text-right">거리</th>
                <th className="py-3 px-4 text-right">소요시간</th>
                <th className="py-3 px-4 text-right">페이스</th>
                <th className="py-3 px-4">코스메모</th>
                <th className="py-3 px-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-semibold">
                    조회된 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isTeacher = rec.userType === 'teacher';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            isTeacher
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-blue-100 text-blue-900 border border-blue-200'
                          }`}
                        >
                          {isTeacher ? '교사' : '학생'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {rec.name}
                      </td>

                      <td className="py-3.5 px-4">
                        {isTeacher ? (
                          <div className="space-y-0.5">
                            <span className="text-slate-500 text-[11px] block">
                              {rec.teacherRole || '교사'}
                            </span>
                            {rec.contributedClass && rec.contributedClass !== 'none' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                <HeartHandshake className="w-3 h-3 text-amber-600" />
                                {rec.contributedClass} 기여
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">개인기록</span>
                            )}
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-700">
                            {rec.grade} {rec.classNum} {rec.studentNo ? `(${rec.studentNo}번)` : ''}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {rec.date}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black font-mono text-blue-900">
                        {rec.distanceKm} km
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                        {formatSeconds(rec.durationSeconds, false)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-700">
                        {rec.pace}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={rec.memo}>
                        {rec.memo || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(rec)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="기록 수정"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(rec.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="기록 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-base font-black text-slate-900">
                러닝 기록 정보 수정
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong>대상:</strong> {editingRecord.name} ({editingRecord.userType === 'student' ? `${editingRecord.grade} ${editingRecord.classNum}` : '교사'})
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  달린 거리 (km)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editDistance}
                  onChange={(e) => setEditDistance(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  러닝 날짜
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium"
                />
              </div>

              {editingRecord.userType === 'teacher' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    교사의 기여 학급 변경
                  </label>
                  <select
                    value={editContributedClass}
                    onChange={(e) => setEditContributedClass(e.target.value as ContributedClass)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="none">기여하지 않음 (개인 기록)</option>
                    <option value="1학년 1반">1학년 1반</option>
                    <option value="1학년 2반">1학년 2반</option>
                    <option value="2학년 1반">2학년 1반</option>
                    <option value="2학년 2반">2학년 2반</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  코스메모
                </label>
                <textarea
                  rows={2}
                  value={editMemo}
                  onChange={(e) => setEditMemo(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl bg-blue-900 text-white font-bold text-xs shadow-sm hover:bg-blue-800 disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '수정 사항 저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-slate-900">
              러닝 기록을 삭제하시겠습니까?
            </h3>
            <p className="text-xs text-slate-500">
              삭제된 기록은 반별 누적 거리 합계에서도 즉시 제외됩니다. 이 작업은 되돌릴 수 없습니다.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전체 삭제(Bulk Delete) 확인 모달 */}
      {isConfirmingBulkDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              전체 러닝 기록을 모두 삭제하시겠습니까?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              현재 저장된 <strong>총 {records.length}건</strong>의 모든 러닝 기록과 예시 데이터가 완전히 삭제되며, 반별 누적 거리도 0km로 초기화됩니다.
              <br /><br />
              <span className="font-bold text-rose-600">※ 삭제 후 기존 예시 데이터가 다시 복원되지 않습니다.</span>
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setIsConfirmingBulkDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isBulkDeleting ? '전체 삭제 진행 중...' : '모두 영구 삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
