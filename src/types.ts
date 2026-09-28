export type UserType = 'student' | 'teacher';

export type StudentGrade = '1학년' | '2학년';
export type StudentClass = '1반' | '2반';

export type ContributedClass = 
  | 'none' 
  | '1학년 1반' 
  | '1학년 2반' 
  | '2학년 1반' 
  | '2학년 2반';

export interface RunningRecord {
  id: string;
  userType: UserType;
  // 학생 정보
  grade?: StudentGrade;
  classNum?: StudentClass;
  studentNo?: number; // 1 ~ 21
  // 공통/교사 정보
  name: string;
  teacherRole?: string; // e.g. '체육부장', '1학년 1반 담임'
  contributedClass?: ContributedClass; // 교사의 기여할 학급
  // 러닝 데이터
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  distanceKm: number; // km
  durationSeconds: number; // 소요시간 (초)
  pace: string; // 실시간 계산된 페이스 (예: 5'30")
  memo: string; // 소감/메모
  imageUrl?: string; // 인증 사진 (Firebase Storage URL 또는 Base64)
  createdAt: string; // ISO string
}

export interface ClassStats {
  className: '1학년 1반' | '1학년 2반' | '2학년 1반' | '2학년 2반';
  studentKm: number;
  teacherKm: number;
  totalKm: number;
  studentRuns: number;
  teacherRuns: number;
  totalRuns: number;
  contributingTeachers: string[];
}

export type ActiveTab = 'record' | 'leaderboard' | 'gps' | 'guide' | 'admin';
