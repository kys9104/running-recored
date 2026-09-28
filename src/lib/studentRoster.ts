import { StudentGrade, StudentClass } from '../types';

export interface StudentInfo {
  grade: StudentGrade;
  classNum: StudentClass;
  studentNo: number;
  name: string;
}

export const STUDENT_ROSTER: StudentInfo[] = [
  // 1학년 1반
  { grade: '1학년', classNum: '1반', studentNo: 1, name: '곽승준' },
  { grade: '1학년', classNum: '1반', studentNo: 2, name: '김건우' },
  { grade: '1학년', classNum: '1반', studentNo: 3, name: '김준성' },
  { grade: '1학년', classNum: '1반', studentNo: 4, name: '김현지' },
  { grade: '1학년', classNum: '1반', studentNo: 5, name: '명지호' },
  { grade: '1학년', classNum: '1반', studentNo: 7, name: '박주영' },
  { grade: '1학년', classNum: '1반', studentNo: 8, name: '박호연' },
  { grade: '1학년', classNum: '1반', studentNo: 9, name: '백호' },
  { grade: '1학년', classNum: '1반', studentNo: 10, name: '선준혁' },
  { grade: '1학년', classNum: '1반', studentNo: 11, name: '송현우' },
  { grade: '1학년', classNum: '1반', studentNo: 12, name: '양준성' },
  { grade: '1학년', classNum: '1반', studentNo: 13, name: '이관훈' },
  { grade: '1학년', classNum: '1반', studentNo: 14, name: '이민수' },
  { grade: '1학년', classNum: '1반', studentNo: 16, name: '이예준' },
  { grade: '1학년', classNum: '1반', studentNo: 17, name: '임솔지' },
  { grade: '1학년', classNum: '1반', studentNo: 18, name: '장범석' },
  { grade: '1학년', classNum: '1반', studentNo: 19, name: '정찬주' },
  { grade: '1학년', classNum: '1반', studentNo: 20, name: '조희우' },
  { grade: '1학년', classNum: '1반', studentNo: 21, name: '홍서현' },

  // 1학년 2반
  { grade: '1학년', classNum: '2반', studentNo: 1, name: '강성수' },
  { grade: '1학년', classNum: '2반', studentNo: 3, name: '김보현' },
  { grade: '1학년', classNum: '2반', studentNo: 4, name: '김예준' },
  { grade: '1학년', classNum: '2반', studentNo: 5, name: '문경호' },
  { grade: '1학년', classNum: '2반', studentNo: 6, name: '박이한' },
  { grade: '1학년', classNum: '2반', studentNo: 7, name: '박해일' },
  { grade: '1학년', classNum: '2반', studentNo: 8, name: '백승광' },
  { grade: '1학년', classNum: '2반', studentNo: 9, name: '백현주' },
  { grade: '1학년', classNum: '2반', studentNo: 10, name: '신예영' },
  { grade: '1학년', classNum: '2반', studentNo: 11, name: '윤호현' },
  { grade: '1학년', classNum: '2반', studentNo: 12, name: '이진우' },
  { grade: '1학년', classNum: '2반', studentNo: 13, name: '이진주' },
  { grade: '1학년', classNum: '2반', studentNo: 14, name: '이진혁' },
  { grade: '1학년', classNum: '2반', studentNo: 15, name: '이채아' },
  { grade: '1학년', classNum: '2반', studentNo: 16, name: '정솔비' },
  { grade: '1학년', classNum: '2반', studentNo: 17, name: '조하얀' },
  { grade: '1학년', classNum: '2반', studentNo: 18, name: '주단비' },
  { grade: '1학년', classNum: '2반', studentNo: 19, name: '최우진' },

  // 2학년 1반
  { grade: '2학년', classNum: '1반', studentNo: 1, name: '강성률' },
  { grade: '2학년', classNum: '1반', studentNo: 2, name: '고아영' },
  { grade: '2학년', classNum: '1반', studentNo: 3, name: '김서윤' },
  { grade: '2학년', classNum: '1반', studentNo: 4, name: '김서준' },
  { grade: '2학년', classNum: '1반', studentNo: 5, name: '김승준' },
  { grade: '2학년', classNum: '1반', studentNo: 6, name: '김예찬' },
  { grade: '2학년', classNum: '1반', studentNo: 7, name: '김주엘' },
  { grade: '2학년', classNum: '1반', studentNo: 8, name: '김현우' },
  { grade: '2학년', classNum: '1반', studentNo: 9, name: '신승민' },
  { grade: '2학년', classNum: '1반', studentNo: 10, name: '안현서' },
  { grade: '2학년', classNum: '1반', studentNo: 12, name: '이하늘' },
  { grade: '2학년', classNum: '1반', studentNo: 13, name: '장준혁' },
  { grade: '2학년', classNum: '1반', studentNo: 14, name: '정서연' },
  { grade: '2학년', classNum: '1반', studentNo: 15, name: '주시은' },
  { grade: '2학년', classNum: '1반', studentNo: 16, name: '주혜진' },
  { grade: '2학년', classNum: '1반', studentNo: 17, name: '한주아' },
  { grade: '2학년', classNum: '1반', studentNo: 18, name: '한준범' },

  // 2학년 2반
  { grade: '2학년', classNum: '2반', studentNo: 2, name: '김대륜' },
  { grade: '2학년', classNum: '2반', studentNo: 3, name: '김승민' },
  { grade: '2학년', classNum: '2반', studentNo: 5, name: '문경원' },
  { grade: '2학년', classNum: '2반', studentNo: 6, name: '문대호' },
  { grade: '2학년', classNum: '2반', studentNo: 7, name: '박대성' },
  { grade: '2학년', classNum: '2반', studentNo: 8, name: '박찬수' },
  { grade: '2학년', classNum: '2반', studentNo: 9, name: '승주빈' },
  { grade: '2학년', classNum: '2반', studentNo: 10, name: '유동준' },
  { grade: '2학년', classNum: '2반', studentNo: 11, name: '이민서' },
  { grade: '2학년', classNum: '2반', studentNo: 12, name: '이태형' },
  { grade: '2학년', classNum: '2반', studentNo: 13, name: '장성효' },
  { grade: '2학년', classNum: '2반', studentNo: 14, name: '진재원' },
  { grade: '2학년', classNum: '2반', studentNo: 15, name: '최가은' },
  { grade: '2학년', classNum: '2반', studentNo: 16, name: '최지윤' },
  { grade: '2학년', classNum: '2반', studentNo: 17, name: '하태민' },
];

export function getStudentsByClass(grade: StudentGrade, classNum: StudentClass): StudentInfo[] {
  return STUDENT_ROSTER.filter((s) => s.grade === grade && s.classNum === classNum);
}

export function findStudent(grade: StudentGrade, classNum: StudentClass, studentNo: number): StudentInfo | undefined {
  return STUDENT_ROSTER.find((s) => s.grade === grade && s.classNum === classNum && s.studentNo === studentNo);
}
