/* ========================================
   설정 파일
   Google Apps Script 배포 URL을 여기에 입력하세요
   ======================================== */

const CONFIG = {
  // Google Apps Script 웹앱 배포 URL (설정 가이드 참고)
  API_URL: 'https://script.google.com/macros/s/AKfycbyw3C_YIRnfmpT2NnH8yPUNZgdMsdqRRsRt1aKW2uSOLsFEKOHSm72vL7kzk_aZ1nZJ/exec',

  // Google Sheets 스프레드시트 ID
  SPREADSHEET_ID: '1mM82cU3KHvV1AnqrUTo_kw75F2xMeldXu0YoutJNiqE',

  // Google Drive 폴더 ID
  DRIVE_FOLDERS: {
    ROOT: '1PurR-YkeQt2sdndX3ahNQsg3sQvFCORM',
    ESTIMATES: '16uKvCmmq3nfQtEiU97Kz-6UvrHBsZ4OB',      // 견적서 폴더
    INVOICES: '1MASrtzkaaWoPisImRIPKTjvwl61GUd0W',         // 청구서 폴더
    PHOTOS: '1ZlKBby-xmJwJYdV_2k4Cp7_UA1yFFID7',             // 사진 폴더
    EXPENSE_PLANS: '1DMIp5442YlVVMuea0iVTGoqq07MiOBfV' // 지출계획서 폴더
  },

  // 시스템 설정
  SYSTEM: {
    SUPPORT_RATE: 0.3,        // 지원 비율 30%
    MARKETING_FEE_RATE: 0.1,  // 공동마케팅비 비율 10%
    YEAR: 2026,
    PROJECT_NAME: '2026년 남원시 지역단위 농촌관광 사업'
  },

  // 페이지네이션
  PAGE_SIZE: 20,

  // 세션 타임아웃 (밀리초, 2시간)
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000
};
