import { RunningRecord, ClassStats } from '../types';

/**
 * 거리(km)와 소요 시간(초)을 기반으로 평균 페이스(분'초"/km)를 계산합니다.
 */
export function calculatePace(distanceKm: number, totalSeconds: number): string {
  if (!distanceKm || distanceKm <= 0 || !totalSeconds || totalSeconds <= 0) {
    return "-'--\"";
  }

  const secondsPerKm = totalSeconds / distanceKm;
  if (secondsPerKm > 3600) {
    return ">60'00\"";
  }

  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);

  return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
}

/**
 * 초를 'HH:MM:SS' 또는 'MM:SS' 형식의 문자열로 변환합니다.
 */
export function formatSeconds(totalSeconds: number, includeHours: boolean = true): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (includeHours || hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 하버사인(Haversine) 공식을 활용하여 두 GPS 좌표 간의 최단 표면 거리(km)를 산출합니다.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 지구 평균 반경 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 4개 학급(1-1, 1-2, 2-1, 2-2)에 대해 학생 기록과 기여한 교사 기록을 통합 집계합니다.
 */
export function aggregateClassStats(records: RunningRecord[]): ClassStats[] {
  const targetClasses: Array<ClassStats['className']> = [
    '1학년 1반',
    '1학년 2반',
    '2학년 1반',
    '2학년 2반',
  ];

  return targetClasses.map((className) => {
    let studentKm = 0;
    let teacherKm = 0;
    let studentRuns = 0;
    let teacherRuns = 0;
    const contributingTeachersSet = new Set<string>();

    records.forEach((record) => {
      // 1. 학생 기록: 소속 반 일치
      if (record.userType === 'student') {
        const studentClass = `${record.grade} ${record.classNum}`;
        if (studentClass === className) {
          studentKm += Number(record.distanceKm) || 0;
          studentRuns += 1;
        }
      }
      // 2. 교사 기록: 기여 학급으로 지정된 경우
      else if (record.userType === 'teacher') {
        if (record.contributedClass === className) {
          teacherKm += Number(record.distanceKm) || 0;
          teacherRuns += 1;
          contributingTeachersSet.add(record.name);
        }
      }
    });

    const totalKm = Number((studentKm + teacherKm).toFixed(2));
    studentKm = Number(studentKm.toFixed(2));
    teacherKm = Number(teacherKm.toFixed(2));

    return {
      className,
      studentKm,
      teacherKm,
      totalKm,
      studentRuns,
      teacherRuns,
      totalRuns: studentRuns + teacherRuns,
      contributingTeachers: Array.from(contributingTeachersSet),
    };
  });
}

/**
 * 전체 러닝 기록을 한국어 엑셀 호환 UTF-8 BOM 인코딩 CSV로 내보냅니다.
 */
export function exportRecordsToCSV(records: RunningRecord[]): void {
  const headers = [
    '등록ID',
    '구분',
    '이름',
    '학년/소속',
    '반',
    '번호',
    '선생님 기여학급',
    '러닝날짜',
    '거리(km)',
    '소요시간',
    '페이스',
    '소감 및 메모',
    '등록일시'
  ];

  const rows = records.map((r) => {
    const userTypeStr = r.userType === 'student' ? '학생' : '교사';
    const gradeOrRole = r.userType === 'student' ? (r.grade || '') : (r.teacherRole || '교사');
    const classNum = r.userType === 'student' ? (r.classNum || '') : '-';
    const studentNo = r.userType === 'student' ? `${r.studentNo || ''}번` : '-';
    const teacherContribution = r.userType === 'teacher' 
      ? (r.contributedClass === 'none' || !r.contributedClass ? '개인기록' : r.contributedClass) 
      : '-';

    return [
      `"${r.id}"`,
      `"${userTypeStr}"`,
      `"${r.name}"`,
      `"${gradeOrRole}"`,
      `"${classNum}"`,
      `"${studentNo}"`,
      `"${teacherContribution}"`,
      `"${r.date}"`,
      r.distanceKm,
      `"${formatSeconds(r.durationSeconds)}"`,
      `"${r.pace}"`,
      `"${(r.memo || '').replace(/"/g, '""')}"`,
      `"${r.createdAt}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const nowStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `신안해양과학고_사제동행러닝_전체기록_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 초기 데모 및 기본 시드 데이터 (사용자 요청에 따라 예시 데이터 비활성화)
 */
export const INITIAL_SAMPLE_RECORDS: RunningRecord[] = [];

export interface MonthlyClassTrend {
  monthKey: string;
  monthLabel: string;
  fullMonthLabel: string;
  '1학년 1반': number;
  '1학년 2반': number;
  '2학년 1반': number;
  '2학년 2반': number;
  totalKm: number;
}

/**
 * 반별 누적 거리 월별 추이 집계
 */
export function aggregateMonthlyClassStats(records: RunningRecord[]): MonthlyClassTrend[] {
  const monthMap: Record<
    string,
    { '1학년 1반': number; '1학년 2반': number; '2학년 1반': number; '2학년 2반': number; totalKm: number }
  > = {};

  records.forEach((rec) => {
    const dateStr = rec.date || (rec.createdAt ? rec.createdAt.slice(0, 10) : '');
    if (!dateStr || dateStr.length < 7) return;
    const monthKey = dateStr.slice(0, 7); // "YYYY-MM"

    if (!monthMap[monthKey]) {
      monthMap[monthKey] = {
        '1학년 1반': 0,
        '1학년 2반': 0,
        '2학년 1반': 0,
        '2학년 2반': 0,
        totalKm: 0,
      };
    }

    let targetClass: string | null = null;
    if (rec.userType === 'student') {
      targetClass = `${rec.grade} ${rec.classNum}`;
    } else if (rec.userType === 'teacher' && rec.contributedClass && rec.contributedClass !== 'none') {
      targetClass = rec.contributedClass;
    }

    const km = Number(rec.distanceKm) || 0;
    if (targetClass && targetClass in monthMap[monthKey]) {
      monthMap[monthKey][targetClass as '1학년 1반' | '1학년 2반' | '2학년 1반' | '2학년 2반'] += km;
    }
    monthMap[monthKey].totalKm += km;
  });

  const sortedKeys = Object.keys(monthMap).sort();

  return sortedKeys.map((key) => {
    const parts = key.split('-');
    const monthNum = parseInt(parts[1], 10);
    const yearShort = parts[0]?.slice(2);
    const fullLabel = `${parts[0]}년 ${monthNum}월`;
    const shortLabel = `${monthNum}월`;

    const data = monthMap[key];
    return {
      monthKey: key,
      monthLabel: shortLabel,
      fullMonthLabel: fullLabel,
      '1학년 1반': Number(data['1학년 1반'].toFixed(1)),
      '1학년 2반': Number(data['1학년 2반'].toFixed(1)),
      '2학년 1반': Number(data['2학년 1반'].toFixed(1)),
      '2학년 2반': Number(data['2학년 2반'].toFixed(1)),
      totalKm: Number(data.totalKm.toFixed(1)),
    };
  });
}
