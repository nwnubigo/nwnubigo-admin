# 남원시 농촌관광 통합 관리 시스템 - 설정 가이드

초보자도 따라할 수 있도록 단계별로 설명합니다.

---

## 1단계: Google Sheets 데이터베이스 생성

### 1-1. Google Sheets 생성
1. [Google Sheets](https://sheets.google.com) 접속
2. **빈 스프레드시트** 클릭하여 새 문서 생성
3. 문서 이름을 `남원시_농촌관광_DB`로 변경
4. URL에서 스프레드시트 ID를 복사
   - URL 예시: `https://docs.google.com/spreadsheets/d/여기가_스프레드시트_ID/edit`
   - `여기가_스프레드시트_ID` 부분을 복사해 메모장에 저장

### 1-2. 시트 생성 (자동)
> 시트는 Google Apps Script의 `initializeSheets()` 함수로 자동 생성됩니다. (3단계 참고)

---

## 2단계: Google Drive 폴더 구조 생성

### 2-1. 폴더 생성
1. [Google Drive](https://drive.google.com) 접속
2. 아래 폴더 구조를 생성:
   ```
   남원시_농촌관광/
   ├── 견적서/
   ├── 청구서/
   ├── 체험사진/
   └── 지출계획서/
   ```
3. 각 폴더를 클릭하여 URL에서 **폴더 ID**를 복사
   - URL 예시: `https://drive.google.com/drive/folders/여기가_폴더_ID`

### 2-2. 폴더 공유 설정
1. 각 폴더를 우클릭 > **공유** > **링크가 있는 모든 사용자** > **편집자**로 설정
   (또는 Google Apps Script 서비스 계정에 접근 권한 부여)

---

## 3단계: Google Apps Script 백엔드 설정

### 3-1. Apps Script 프로젝트 생성
1. [Google Apps Script](https://script.google.com) 접속
2. **새 프로젝트** 클릭
3. 프로젝트 이름을 `남원시_농촌관광_API`로 변경

### 3-2. 코드 붙여넣기
1. 기본 `Code.gs` 파일의 내용을 모두 삭제
2. 프로젝트의 `gas/Code.gs` 파일 내용을 전체 복사하여 붙여넣기

### 3-3. 설정값 수정
`Code.gs` 상단의 설정값을 본인의 ID로 변경:

```javascript
const SPREADSHEET_ID = '1단계에서_복사한_스프레드시트_ID';
const DRIVE_FOLDER_IDS = {
  ESTIMATES: '견적서_폴더_ID',
  INVOICES: '청구서_폴더_ID',
  PHOTOS: '체험사진_폴더_ID',
  EXPENSE_PLANS: '지출계획서_폴더_ID'
};
```

### 3-4. 시트 초기화 (최초 1회)
1. 상단 함수 선택에서 `initializeSheets` 선택
2. **실행** 버튼 클릭
3. 권한 요청이 나오면 **고급** > **안전하지 않은 페이지로 이동** > **허용**
4. Google Sheets에 11개 시트가 자동 생성됨
5. 기본 관리자 계정이 생성됨:
   - 아이디: `01000000000`
   - 비밀번호: `admin1234`

### 3-5. 크롤링 트리거 설정 (선택사항)
1. 함수 선택에서 `setupCrawlingTriggers` 선택
2. **실행** 클릭
3. 매일 08시, 12시, 19시, 23시에 자동 크롤링 실행

### 3-6. 웹앱 배포
1. 상단 메뉴: **배포** > **새 배포**
2. 유형 선택: **웹 앱**
3. 설명: `v1.0`
4. 실행 사용자: **나**
5. 액세스 권한: **모든 사용자**
6. **배포** 클릭
7. **웹 앱 URL**을 복사 (중요!)
   - 예: `https://script.google.com/macros/s/AKfycb.../exec`

---

## 4단계: 프론트엔드 설정

### 4-1. config.js 수정
`js/config.js` 파일을 열어 설정값 수정:

```javascript
const CONFIG = {
  API_URL: '3단계에서_복사한_웹앱_URL',
  SPREADSHEET_ID: '1단계에서_복사한_스프레드시트_ID',
  DRIVE_FOLDERS: {
    ROOT: '남원시_농촌관광_폴더_ID',
    ESTIMATES: '견적서_폴더_ID',
    INVOICES: '청구서_폴더_ID',
    PHOTOS: '체험사진_폴더_ID',
    EXPENSE_PLANS: '지출계획서_폴더_ID'
  },
  // ... 나머지는 그대로 유지
};
```

---

## 5단계: GitHub Pages 배포

### 5-1. GitHub 계정 생성
1. [GitHub](https://github.com) 접속
2. 계정이 없으면 **Sign Up** 클릭하여 가입

### 5-2. 저장소 생성
1. GitHub 로그인 후 **New repository** 클릭
2. Repository name: `nwnubigo-admin`
3. **Public** 선택
4. **Create repository** 클릭

### 5-3. 파일 업로드
1. 생성된 저장소 페이지에서 **uploading an existing file** 클릭
2. 프로젝트 폴더의 모든 파일을 드래그 앤 드롭
   - `gas/` 폴더는 제외해도 됨 (Apps Script에 직접 붙여넣었으므로)
3. **Commit changes** 클릭

### 5-4. GitHub Pages 활성화
1. 저장소 > **Settings** > 왼쪽 메뉴 **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**, 폴더: **/ (root)**
4. **Save** 클릭
5. 몇 분 후 URL이 생성됨:
   - `https://[사용자명].github.io/nwnubigo-admin/`

### 5-5. 접속 테스트
1. 위 URL로 접속
2. 로그인 페이지가 표시되면 성공
3. 관리자 로그인: `010-0000-0000` / `admin1234`

---

## 6단계: 운영 시작

### 6-1. 경영체 등록
1. 관리자로 로그인
2. **경영체 관리** > **경영체 등록**
3. 각 경영체 정보 입력 (이름, 연락처, 유형 등)
4. 기본 비밀번호는 `1234` (경영체가 로그인 후 변경 권장)

### 6-2. 프로그램 등록
1. **프로그램 관리** > **프로그램 등록**
2. 숙박/체험/식사 프로그램 정보 입력
3. 정가 입력 시 지원금(30%), 관광객부담금(70%) 자동 계산

### 6-3. 경영체 안내
경영체에 아래 내용을 안내:
- 접속 URL
- 로그인 방법 (핸드폰번호 + 비밀번호)
- 견적서 관리, 청구서 관리 사용법

---

## 주요 업무 흐름

```
1. 관광객이 네이버플레이스에서 예약/결제
2. 예약정보 자동 크롤링 (또는 수동 입력)
3. 경영체가 견적서 작성 → Google Drive에 파일 저장
4. 관리자가 견적서 검토완료 → 지출계획서 자동 생성
5. 관광 프로그램 진행
6. 경영체가 참석자명부/체험사진 업로드 (퇴실 후 3일 이내)
7. 관리자가 청구서 검토
8. 프로그램비 지급 (이나라도움카드, 상품가 30%)
9. 경영체가 공동마케팅비 납부 (판매액 10%, 익월 5일까지)
10. 관리자가 입금확인증 발행
```

---

## 문제 해결

### API 연결 안 됨
- `js/config.js`의 `API_URL`이 올바른지 확인
- Google Apps Script 웹앱이 배포되었는지 확인
- 웹앱 액세스 권한이 "모든 사용자"인지 확인

### CORS 오류
- Google Apps Script는 기본적으로 CORS를 허용합니다
- `doPost`에서 `ContentService.createTextOutput`을 사용하고 있는지 확인

### 로그인 실패
- Google Sheets의 `경영체_기본정보` 시트에 데이터가 있는지 확인
- 연락처(핸드폰번호)에 하이픈(-) 없이 저장되어 있는지 확인
- 비밀번호가 해시 처리되어 저장되어 있는지 확인

### 크롤링 실패
- 네이버 플레이스 URL이 올바른지 확인
- 수동 입력 기능을 활용하여 예약 정보를 직접 등록

### 파일 업로드 실패
- Google Drive 폴더 ID가 올바른지 확인
- Google Drive 폴더의 공유 설정 확인

---

## 파일 구조 요약

```
nwnubigo_admin/
├── login.html              ← 로그인 페이지
├── css/style.css           ← 공통 스타일 (반응형)
├── js/
│   ├── config.js           ← 설정 (API URL, 폴더 ID 등)
│   ├── api.js              ← API 통신 모듈
│   ├── auth.js             ← 로그인/로그아웃
│   └── utils.js            ← 유틸리티 함수
├── admin/                  ← 관리자 페이지
│   ├── dashboard.html      ← 관리자 대시보드
│   ├── business-manage.html← 경영체 관리
│   ├── program-manage.html ← 프로그램 관리
│   ├── estimate-review.html← 견적서 검토
│   ├── invoice-review.html ← 청구서 검토
│   ├── payment-manage.html ← 프로그램비 지급
│   ├── marketing-fee.html  ← 공동마케팅비 관리
│   ├── membership-fee.html ← 회비 관리
│   └── event-manage.html   ← 행사 관리
├── business/               ← 경영체 페이지
│   ├── dashboard.html      ← 경영체 대시보드
│   ├── estimate.html       ← 견적서 관리
│   ├── invoice.html        ← 청구서 관리
│   └── marketing-fee.html  ← 공동마케팅비 납부
└── gas/
    └── Code.gs             ← Google Apps Script 백엔드
```
