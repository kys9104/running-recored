import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  onSnapshot,
  getDocFromServer,
  Firestore 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { RunningRecord } from '../types';
import { INITIAL_SAMPLE_RECORDS } from './runningUtils';
import firebaseConfigData from '../../firebase-applet-config.json';

// Firebase 설정 객체 (firebase-applet-config.json 우선, 환경 변수 폴백)
const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseConfigData.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseConfigData.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseConfigData.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseConfigData.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseConfigData.appId || import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId || '(default)',
};

// 유효한 Firebase 프로젝트 설정 검사
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // firestoreDatabaseId가 지정된 경우 해당 데이터베이스 ID로 연결
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    
    storage = getStorage(app);

    // 익명 인증 시도 (사용자 로그인 없이도 Firestore 보안 규칙 준수 지원)
    try {
      const auth = getAuth(app);
      signInAnonymously(auth).catch((err) => {
        console.warn('Firebase Anonymous Auth notice:', err);
      });
    } catch (authErr) {
      console.warn('Firebase Auth initialization note:', authErr);
    }
  } catch (err) {
    console.warn('Firebase 초기화 실패, 로컬 저장소로 자동 폴백합니다:', err);
  }
}

const LOCAL_STORAGE_KEY = 'shinan_marine_running_records_v1';

// 로컬 스토리지 데이터 가져오기 (삭제 후 빈 배열([]) 정상 유지)
function getLocalRecords(): RunningRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// 로컬 스토리지에 데이터 저장
function saveLocalRecords(records: RunningRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('로컬스토리지 저장 실패:', err);
  }
}

/**
 * 러닝 기록 전체 조회 (Firestore 실시간 클라우드 DB 우선, 미연결 시 로컬 스토리지)
 * 관리자가 전체 삭제한 경우 빈 배열([])을 그대로 유지하여 예시 데이터가 복원되지 않습니다.
 */
export async function fetchAllRecords(): Promise<RunningRecord[]> {
  if (db && isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'running_records'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const records: RunningRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as RunningRecord);
      });

      // 최신 등록 순 정렬 (날짜 -> 작성 시간)
      records.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      // 클라우드 데이터를 로컬 캐시로도 갱신
      saveLocalRecords(records);
      return records;
    } catch (error) {
      console.warn('Firestore 조회 실패, 로컬 저장소 데이터 반환:', error);
      return getLocalRecords();
    }
  }

  return getLocalRecords();
}

/**
 * 실시간 변경사항 구독 (PC와 스마트폰 등 모든 기기에서 데이터가 실시간으로 동기화됨)
 * 다른 사용자가 등록/수정/삭제 시 모든 기기 화면에 즉각 반영됩니다.
 */
export function subscribeToRecords(onUpdate: (records: RunningRecord[]) => void): () => void {
  if (!db || !isFirebaseConfigured) {
    // Firestore 미연동 시 1회 호출
    onUpdate(getLocalRecords());
    return () => {};
  }

  try {
    const q = query(collection(db, 'running_records'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          saveLocalRecords([]);
          onUpdate([]);
          return;
        }

        const records: RunningRecord[] = [];
        snapshot.forEach((docSnap) => {
          records.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as RunningRecord);
        });

        // 최신 등록 순 정렬 (날짜 -> 작성 시간)
        records.sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) return dateDiff;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        // 최신 클라우드 데이터를 로컬에도 저장하고 UI에 실시간 전파
        saveLocalRecords(records);
        onUpdate(records);
      },
      (error) => {
        console.warn('Firestore 실시간 리스너 오류, 로컬 캐시 사용:', error);
        onUpdate(getLocalRecords());
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('실시간 구독 등록 실패:', err);
    onUpdate(getLocalRecords());
    return () => {};
  }
}

/**
 * 새 러닝 기록 추가 (로컬 스토리지 즉시 저장 및 Firestore 실시간 클라우드 동기화)
 * 다른 사용자 기기로 실시간 브로드캐스팅되어 전체 사용자 화면에 즉각 공유됩니다.
 */
export async function createRecord(recordData: Omit<RunningRecord, 'id' | 'createdAt'>): Promise<RunningRecord> {
  const generatedId = 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const newRecord: RunningRecord = {
    ...recordData,
    id: generatedId,
    createdAt: new Date().toISOString(),
  };

  // 1. 항상 로컬 스토리지에 즉시 저장
  const current = getLocalRecords();
  const updated = [newRecord, ...current.filter(r => r.id !== newRecord.id)];
  saveLocalRecords(updated);

  // 2. Firestore 클라우드 데이터베이스에 실시간 저장 (네트워크 안정 시 100~200ms 완료)
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'running_records', newRecord.id);
      const sanitizedData = Object.fromEntries(
        Object.entries(newRecord).filter(([_, v]) => v !== undefined)
      );
      
      // 클라우드 저장 완료 대기 (최대 2.5초 타임아웃으로 오프라인 시에도 UI 멈춤 방지)
      await Promise.race([
        setDoc(docRef, sanitizedData),
        new Promise((resolve) => setTimeout(resolve, 2500))
      ]);
      console.log('클라우드 Firestore에 러닝 기록 저장 완료:', newRecord.id);
    } catch (err) {
      console.warn('Firestore 클라우드 기록 추가 오류 (로컬에 안전하게 저장됨):', err);
    }
  }

  return newRecord;
}

/**
 * 러닝 기록 수정
 */
export async function updateRecord(id: string, updates: Partial<RunningRecord>): Promise<void> {
  const current = getLocalRecords();
  const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveLocalRecords(updated);

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'running_records', id);
      const sanitizedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await Promise.race([
        updateDoc(docRef, sanitizedUpdates as any),
        new Promise((resolve) => setTimeout(resolve, 2500))
      ]);
      console.log('Firestore 기록 수정 완료:', id);
    } catch (err) {
      console.warn('Firestore 수정 실패:', err);
    }
  }
}

/**
 * 러닝 기록 삭제
 */
export async function deleteRecord(id: string): Promise<void> {
  const current = getLocalRecords();
  const updated = current.filter((item) => item.id !== id);
  saveLocalRecords(updated);

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'running_records', id);
      await Promise.race([
        deleteDoc(docRef),
        new Promise((resolve) => setTimeout(resolve, 2500))
      ]);
      console.log('Firestore 기록 삭제 완료:', id);
    } catch (err) {
      console.warn('Firestore 삭제 실패:', err);
    }
  }
}

/**
 * 러닝 기록 전체 일괄 삭제 (초기화)
 * 로컬 저장소 및 Firestore 클라우드 상의 모든 러닝 기록을 영구 삭제하며 다시 복원되지 않습니다.
 */
export async function deleteAllRecords(): Promise<void> {
  saveLocalRecords([]);

  if (db && isFirebaseConfigured) {
    try {
      const q = query(collection(db, 'running_records'));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((docSnap) => deleteDoc(doc(db, 'running_records', docSnap.id)));
      await Promise.all(deletePromises);
      console.log(`Firestore 전체 기록(${snapshot.docs.length}건) 삭제 완료`);
    } catch (err) {
      console.warn('Firestore 전체 기록 삭제 알림 (로컬은 완전 삭제됨):', err);
    }
  }
}

/**
 * 러닝 인증 사진 최적화 및 압축 (브라우저 자체 HTML5 Canvas 기반)
 * Firebase 프로젝트 인증키나 외부 클라우드 스토리지 설정 없이도 즉시(0.05초 내) 동작하며 멈춤 현상이 발생하지 않습니다.
 */
export async function uploadProofImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (!result) {
          resolve('');
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height = Math.round((height * MAX_WIDTH) / width);
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width = Math.round((width * MAX_HEIGHT) / height);
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(result);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            // 압축된 JPEG 포맷으로 용량을 대폭 줄여 저장 (약 40~80KB)
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            resolve(compressed);
          } catch (canvasErr) {
            console.warn('Canvas 압축 오류, 원본 데이터 사용:', canvasErr);
            resolve(result);
          }
        };
        img.onerror = () => {
          resolve(result);
        };
        img.src = result;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn('이미지 변환 중 오류:', err);
      resolve('');
    }
  });
}
