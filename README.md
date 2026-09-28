# 신안해양과학고등학교 사제동행 러닝(Running) 웹앱

전남 신안군 압해도에 위치한 **신안해양과학고등학교** 학생과 교사가 함께 러닝 기록을 누적하고, 학급별 단체 대항전 및 개인 건강 마일리지를 관리하는 모던 웹 애플리케이션입니다.

---

## 🌟 주요 특징 및 차별점
1. **1·2학년 학생 명단 100% 내장 연동**:
   - 1학년 1반(19명), 1학년 2반(18명), 2학년 1반(17명), 2학년 2반(15명) 실제 재학생 명단 데이터가 포함되어 있어, 학년/반 선택 시 번호 및 이름이 자동으로 동기화됩니다.
2. **사제동행(師弟同行) 학급 기여 시스템**:
   - 선생님이 러닝 기록을 등록할 때 **"기여할 학급(1-1, 1-2, 2-1, 2-2)"**을 지정하면, 해당 반의 총 누적 거리(km)에 선생님의 달린 거리가 자동 합산됩니다.
   - 반별 랭킹 대시보드에서 '학생 마일리지 + 선생님 기여 마일리지'가 분리 및 통합 집계되어 시각화됩니다.
3. **순수 HTML5 Web Geolocation API 실시간 GPS 러닝 메이트**:
   - 유료 외부 지도 API나 AI 모델 호출 없이 순수 브라우저 GPS와 하버사인(Haversine) 공식을 활용하여 거리 및 페이스를 측정하고 실시간 SVG 궤적으로 시각화합니다.
   - 러닝 종료 시 측정된 거리와 시간이 원클릭으로 기록 등록 폼에 자동 입력됩니다.
4. **체육교사 관리자 전용 대시보드**:
   - 비밀번호(`4161`) 인증 모달을 통한 보안 접근.
   - 전체 데이터 테이블 조회, 기록 수정(Edit), 삭제(Delete) 및 **한글 엑셀 호환 UTF-8 BOM CSV 다운로드** 기능 제공.
5. **Vercel 원클릭 배포 & 무설치 즉시 구동**:
   - Firebase 무료 티어(Firestore, Storage) 연동을 지원하며, Firebase 환경 변수가 없을 때도 브라우저 로컬 저장소로 자동 폴백되어 GitHub 및 Vercel 배포 시 즉시 100% 완벽 구동됩니다.

---

## 🚀 기술 스택
- **프론트엔드**: React 19, TypeScript, Vite
- **스타일링**: Tailwind CSS v4, Lucide React (피트니스/마린 아이콘)
- **백엔드/데이터**: Firebase Firestore & Storage (미설정 시 LocalStorage 자동 지원)
- **기기 제어**: HTML5 Geolocation API, Canvas Image Compressor

---

## 💻 설치 및 로컬 실행 방법

```bash
# 1. 패키지 설치
npm install

# 2. 로컬 개발 서버 실행
npm run dev
```

---

## ⚙️ 환경 변수 설정 (.env)
Firebase 클라우드 연동을 원하실 경우 `.env` 파일에 아래 키를 입력하세요:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
*(환경 변수를 설정하지 않아도 브라우저 로컬 저장소를 통해 모든 기능이 정상 동작합니다.)*

---

## 🔐 관리자 계정 안내
- **관리자 탭 비밀번호**: `4161`
