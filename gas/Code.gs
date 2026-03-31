/* ========================================
   남원시 농촌관광 관리시스템 - Google Apps Script 백엔드
   이 파일을 Google Apps Script 에디터에 붙여넣기 하세요.
   ======================================== */

// ========== 설정 ==========
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Google Sheets ID를 입력하세요
const DRIVE_FOLDER_IDS = {
  ESTIMATES: 'YOUR_ESTIMATES_FOLDER_ID',
  INVOICES: 'YOUR_INVOICES_FOLDER_ID',
  PHOTOS: 'YOUR_PHOTOS_FOLDER_ID',
  EXPENSE_PLANS: 'YOUR_EXPENSE_PLANS_FOLDER_ID'
};

const SHEET_NAMES = {
  BUSINESS: '경영체_기본정보',
  PROGRAM: '프로그램_정보',
  LOGIN_LOG: '로그인_기록',
  RESERVATION: '예약정보_크롤링',
  ESTIMATE: '견적서_관리',
  INVOICE: '청구서_관리',
  PAYMENT: '프로그램비_지급관리',
  MARKETING_FEE: '공동마케팅비_납부관리',
  MEMBERSHIP_FEE: '회비_납부관리',
  EVENT: '행사_참여관리',
  EVENT_ATTENDEE: '행사_참석자'
};

const SUPPORT_RATE = 0.3;
const MARKETING_FEE_RATE = 0.1;

// ========== 웹앱 진입점 ==========
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    let result;
    switch (action) {
      // 인증
      case 'login': result = handleLogin(params); break;

      // 경영체
      case 'getBusinessList': result = getBusinessList(); break;
      case 'getBusiness': result = getBusiness(params.businessId); break;
      case 'saveBusiness': result = saveBusiness(params.data); break;
      case 'deleteBusiness': result = deleteBusiness(params.businessId); break;

      // 프로그램
      case 'getProgramList': result = getProgramList(params.businessId); break;
      case 'saveProgram': result = saveProgram(params.data); break;
      case 'deleteProgram': result = deleteProgram(params.programId); break;

      // 예약
      case 'getReservations': result = getReservations(params.businessId); break;
      case 'saveReservation': result = saveReservation(params.data); break;
      case 'triggerCrawling': result = triggerCrawling(params.businessId); break;

      // 견적서
      case 'getEstimateList': result = getEstimateList(params.businessId); break;
      case 'getUnprocessedReservations': result = getUnprocessedReservations(params.businessId); break;
      case 'saveEstimate': result = saveEstimate(params.data); break;
      case 'generateEstimateFile': result = generateEstimateFile(params.estimateId); break;
      case 'reviewEstimate': result = reviewEstimate(params.estimateId, params.status, params.memo); break;

      // 청구서
      case 'getInvoiceList': result = getInvoiceList(params.businessId); break;
      case 'saveInvoice': result = saveInvoice(params.data); break;
      case 'reviewInvoice': result = reviewInvoice(params.invoiceId, params.status, params.memo); break;

      // 프로그램비 지급
      case 'getPaymentList': result = getPaymentList(params.businessId); break;
      case 'processPayment': result = processPayment(params.data); break;

      // 공동마케팅비
      case 'getMarketingFeeList': result = getMarketingFeeList(params.businessId); break;
      case 'updateMarketingFee': result = updateMarketingFee(params.data); break;
      case 'generateDepositReceipt': result = generateDepositReceipt(params.feeId); break;

      // 회비
      case 'getMembershipFeeList': result = getMembershipFeeList(params.businessId); break;
      case 'updateMembershipFee': result = updateMembershipFee(params.data); break;

      // 행사
      case 'getEventList': result = getEventList(); break;
      case 'saveEvent': result = saveEvent(params.data); break;
      case 'getEventAttendees': result = getEventAttendees(params.eventId); break;
      case 'updateAttendance': result = updateAttendance(params.eventId, params.businessId, params.attended); break;

      // 대시보드
      case 'getDashboardStats': result = getDashboardStats(params.businessId); break;

      // 파일 업로드
      case 'uploadFile': result = uploadFile(params.fileBase64, params.fileName, params.folderId); break;

      default:
        result = { success: false, message: '알 수 없는 요청입니다: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: '남원시 농촌관광 관리시스템 API가 정상 작동 중입니다.'
  })).setMimeType(ContentService.MimeType.JSON);
}

// ========== 유틸리티 함수 ==========
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i]);
    return obj;
  });
}

function findRowIndex(sheetName, colName, value) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colIdx = headers.indexOf(colName);
  if (colIdx === -1) return -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIdx] === value) return i + 1; // 1-based row number
  }
  return -1;
}

function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => rowData[h] !== undefined ? rowData[h] : '');
  sheet.appendRow(row);
}

function updateRow(sheetName, rowNum, rowData) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headers.forEach((h, i) => {
    if (rowData[h] !== undefined) {
      sheet.getRange(rowNum, i + 1).setValue(rowData[h]);
    }
  });
}

function generateId(prefix) {
  const num = Utilities.getUuid().substring(0, 6).toUpperCase();
  return prefix + '-' + num;
}

function hashPassword(password) {
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return hash.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

// ========== 인증 ==========
function handleLogin(params) {
  const phone = params.phone.replace(/-/g, '');
  const password = params.password;
  const hashedPw = hashPassword(password);

  const businesses = getSheetData(SHEET_NAMES.BUSINESS);
  const user = businesses.find(b =>
    b['연락처'].replace(/-/g, '') === phone &&
    b['비밀번호'] === hashedPw &&
    b['상태'] === '활성'
  );

  if (!user) {
    return { success: false, message: '휴대폰 번호 또는 비밀번호가 올바르지 않습니다.' };
  }

  // 로그인 기록 저장
  appendRow(SHEET_NAMES.LOGIN_LOG, {
    '로그ID': generateId('LOG'),
    '경영체ID': user['경영체ID'],
    '로그인시간': new Date(),
    '로그아웃시간': '',
    'IP주소': '',
    '디바이스정보': ''
  });

  return {
    success: true,
    data: {
      businessId: user['경영체ID'],
      businessName: user['경영체명'],
      name: user['대표자명'],
      phone: user['연락처'],
      role: user['권한'],
      businessType: user['경영체유형']
    }
  };
}

// ========== 경영체 관리 ==========
function getBusinessList() {
  const data = getSheetData(SHEET_NAMES.BUSINESS);
  // 비밀번호 제외
  const list = data.map(b => {
    const { '비밀번호': _, ...rest } = b;
    return rest;
  });
  return { success: true, data: list };
}

function getBusiness(businessId) {
  const data = getSheetData(SHEET_NAMES.BUSINESS);
  const biz = data.find(b => b['경영체ID'] === businessId);
  if (!biz) return { success: false, message: '경영체를 찾을 수 없습니다.' };
  const { '비밀번호': _, ...rest } = biz;
  return { success: true, data: rest };
}

function saveBusiness(data) {
  if (data['경영체ID']) {
    // 수정
    const rowNum = findRowIndex(SHEET_NAMES.BUSINESS, '경영체ID', data['경영체ID']);
    if (rowNum === -1) return { success: false, message: '경영체를 찾을 수 없습니다.' };
    if (data['비밀번호']) {
      data['비밀번호'] = hashPassword(data['비밀번호']);
    }
    updateRow(SHEET_NAMES.BUSINESS, rowNum, data);
    return { success: true, message: '경영체 정보가 수정되었습니다.' };
  } else {
    // 신규
    data['경영체ID'] = generateId('BIZ');
    data['비밀번호'] = hashPassword(data['비밀번호'] || '1234');
    data['등록일'] = new Date();
    data['상태'] = data['상태'] || '활성';
    data['권한'] = data['권한'] || 'business';
    appendRow(SHEET_NAMES.BUSINESS, data);
    return { success: true, message: '경영체가 등록되었습니다.', data: { businessId: data['경영체ID'] } };
  }
}

function deleteBusiness(businessId) {
  const rowNum = findRowIndex(SHEET_NAMES.BUSINESS, '경영체ID', businessId);
  if (rowNum === -1) return { success: false, message: '경영체를 찾을 수 없습니다.' };
  updateRow(SHEET_NAMES.BUSINESS, rowNum, { '상태': '비활성' });
  return { success: true, message: '경영체가 비활성화되었습니다.' };
}

// ========== 프로그램 관리 ==========
function getProgramList(businessId) {
  let data = getSheetData(SHEET_NAMES.PROGRAM);
  if (businessId) {
    data = data.filter(p => p['경영체ID'] === businessId);
  }
  return { success: true, data: data };
}

function saveProgram(data) {
  if (data['프로그램ID']) {
    const rowNum = findRowIndex(SHEET_NAMES.PROGRAM, '프로그램ID', data['프로그램ID']);
    if (rowNum === -1) return { success: false, message: '프로그램을 찾을 수 없습니다.' };
    // 지원금액/관광객부담금 자동 계산
    if (data['정가']) {
      data['지원금액'] = Math.round(Number(data['정가']) * SUPPORT_RATE);
      data['관광객부담금'] = Number(data['정가']) - data['지원금액'];
    }
    updateRow(SHEET_NAMES.PROGRAM, rowNum, data);
    return { success: true, message: '프로그램이 수정되었습니다.' };
  } else {
    data['프로그램ID'] = generateId('PRG');
    data['등록일'] = new Date();
    data['상태'] = data['상태'] || '활성';
    if (data['정가']) {
      data['지원금액'] = Math.round(Number(data['정가']) * SUPPORT_RATE);
      data['관광객부담금'] = Number(data['정가']) - data['지원금액'];
    }
    appendRow(SHEET_NAMES.PROGRAM, data);
    return { success: true, message: '프로그램이 등록되었습니다.' };
  }
}

function deleteProgram(programId) {
  const rowNum = findRowIndex(SHEET_NAMES.PROGRAM, '프로그램ID', programId);
  if (rowNum === -1) return { success: false, message: '프로그램을 찾을 수 없습니다.' };
  updateRow(SHEET_NAMES.PROGRAM, rowNum, { '상태': '비활성' });
  return { success: true, message: '프로그램이 비활성화되었습니다.' };
}

// ========== 예약 크롤링 ==========
function getReservations(businessId) {
  let data = getSheetData(SHEET_NAMES.RESERVATION);
  if (businessId) {
    data = data.filter(r => r['경영체ID'] === businessId);
  }
  return { success: true, data: data };
}

function saveReservation(data) {
  if (data['크롤링ID']) {
    const rowNum = findRowIndex(SHEET_NAMES.RESERVATION, '크롤링ID', data['크롤링ID']);
    if (rowNum === -1) return { success: false, message: '예약정보를 찾을 수 없습니다.' };
    updateRow(SHEET_NAMES.RESERVATION, rowNum, data);
    return { success: true, message: '예약정보가 수정되었습니다.' };
  } else {
    data['크롤링ID'] = generateId('CRW');
    data['크롤링일시'] = new Date();
    data['견적서처리여부'] = '미처리';
    data['수동입력여부'] = data['수동입력여부'] || true;
    appendRow(SHEET_NAMES.RESERVATION, data);
    return { success: true, message: '예약정보가 등록되었습니다.' };
  }
}

// 크롤링 트리거 (특정 경영체)
function triggerCrawling(businessId) {
  try {
    crawlNaverPlace(businessId);
    return { success: true, message: '크롤링이 완료되었습니다.' };
  } catch (error) {
    return { success: false, message: '크롤링 실패: ' + error.message };
  }
}

// 네이버 플레이스 크롤링 (기본 구조)
function crawlNaverPlace(businessId) {
  const businesses = getSheetData(SHEET_NAMES.BUSINESS);
  let targets = businesses.filter(b => b['상태'] === '활성' && b['네이버플레이스URL']);

  if (businessId) {
    targets = targets.filter(b => b['경영체ID'] === businessId);
  }

  targets.forEach(biz => {
    try {
      const url = biz['네이버플레이스URL'];
      if (!url) return;

      // UrlFetchApp으로 페이지 접근
      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const html = response.getContentText();

      // 네이버 플레이스 예약 정보 파싱
      // 주의: 네이버 페이지 구조가 변경되면 파싱 로직도 수정 필요
      // 실제 구현시 네이버 예약 API 또는 스마트플레이스 관리자 페이지 활용 권장
      const reservations = parseNaverReservations(html, biz['경영체ID']);

      reservations.forEach(res => {
        // 중복 체크
        const existing = getSheetData(SHEET_NAMES.RESERVATION)
          .find(r => r['예약번호'] === res['예약번호'] && r['경영체ID'] === res['경영체ID']);

        if (!existing) {
          res['크롤링ID'] = generateId('CRW');
          res['크롤링일시'] = new Date();
          res['견적서처리여부'] = '미처리';
          res['수동입력여부'] = false;
          appendRow(SHEET_NAMES.RESERVATION, res);
        }
      });
    } catch (error) {
      Logger.log('크롤링 오류 (' + biz['경영체명'] + '): ' + error.message);
    }
  });
}

// 네이버 예약 정보 파싱 (네이버 페이지 구조에 맞게 수정 필요)
function parseNaverReservations(html, businessId) {
  // 이 함수는 네이버 플레이스 페이지 구조에 따라 구현해야 합니다.
  // 현재는 빈 배열을 반환합니다.
  // 실제 구현 시 정규식 또는 HTML 파싱으로 예약 정보를 추출합니다.
  Logger.log('크롤링 실행됨 - 경영체: ' + businessId);
  return [];
}

// 시간 트리거 설정 함수 (최초 1회 실행)
function setupCrawlingTriggers() {
  // 기존 트리거 삭제
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'scheduledCrawling') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // 매일 08시
  ScriptApp.newTrigger('scheduledCrawling').timeBased().atHour(8).everyDays(1).create();
  // 매일 12시
  ScriptApp.newTrigger('scheduledCrawling').timeBased().atHour(12).everyDays(1).create();
  // 매일 19시
  ScriptApp.newTrigger('scheduledCrawling').timeBased().atHour(19).everyDays(1).create();
  // 매일 23시
  ScriptApp.newTrigger('scheduledCrawling').timeBased().atHour(23).everyDays(1).create();

  Logger.log('크롤링 트리거가 설정되었습니다.');
}

function scheduledCrawling() {
  crawlNaverPlace(null); // 모든 활성 경영체 크롤링
}

// ========== 견적서 관리 ==========
function getEstimateList(businessId) {
  let data = getSheetData(SHEET_NAMES.ESTIMATE);
  if (businessId) {
    data = data.filter(e => e['경영체ID_숙박'] === businessId || e['경영체ID_체험'] === businessId);
  }
  return { success: true, data: data };
}

function getUnprocessedReservations(businessId) {
  let data = getSheetData(SHEET_NAMES.RESERVATION);
  data = data.filter(r => r['견적서처리여부'] === '미처리');
  if (businessId) {
    data = data.filter(r => r['경영체ID'] === businessId);
  }
  return { success: true, data: data };
}

function saveEstimate(data) {
  if (data['견적서ID']) {
    const rowNum = findRowIndex(SHEET_NAMES.ESTIMATE, '견적서ID', data['견적서ID']);
    if (rowNum === -1) return { success: false, message: '견적서를 찾을 수 없습니다.' };
    updateRow(SHEET_NAMES.ESTIMATE, rowNum, data);
    return { success: true, message: '견적서가 수정되었습니다.' };
  } else {
    data['견적서ID'] = generateId('EST');
    data['발행일'] = new Date();
    data['검토상태'] = '미검토';
    // 지원금액 자동 계산
    if (data['총금액']) {
      data['지원금액'] = Math.round(Number(data['총금액']) * SUPPORT_RATE);
      data['관광객부담금'] = Number(data['총금액']) - data['지원금액'];
    }
    appendRow(SHEET_NAMES.ESTIMATE, data);

    // 예약 정보의 견적서처리여부 업데이트
    if (data['크롤링ID']) {
      const resRow = findRowIndex(SHEET_NAMES.RESERVATION, '크롤링ID', data['크롤링ID']);
      if (resRow > 0) {
        updateRow(SHEET_NAMES.RESERVATION, resRow, { '견적서처리여부': '처리완료' });
      }
    }

    return { success: true, message: '견적서가 발행되었습니다.', data: { estimateId: data['견적서ID'] } };
  }
}

function generateEstimateFile(estimateId) {
  try {
    const estimates = getSheetData(SHEET_NAMES.ESTIMATE);
    const estimate = estimates.find(e => e['견적서ID'] === estimateId);
    if (!estimate) return { success: false, message: '견적서를 찾을 수 없습니다.' };

    // 경영체 정보 조회
    const businesses = getSheetData(SHEET_NAMES.BUSINESS);
    const lodging = businesses.find(b => b['경영체ID'] === estimate['경영체ID_숙박']);
    const experience = businesses.find(b => b['경영체ID'] === estimate['경영체ID_체험']);

    // 견적서 스프레드시트 생성
    const fileName = '견적서_' + (lodging ? lodging['경영체명'] : '') + '_' +
                     (experience ? experience['경영체명'] : '') + '_' +
                     Utilities.formatDate(new Date(), 'Asia/Seoul', 'MMdd');

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_IDS.ESTIMATES);
    const newSS = SpreadsheetApp.create(fileName);
    const file = DriveApp.getFileById(newSS.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    // 견적서 내용 작성
    const sheet = newSS.getActiveSheet();
    sheet.setName('견적서');

    // 헤더
    sheet.getRange('A1').setValue('견 적 서').setFontSize(18).setFontWeight('bold');
    sheet.getRange('A3').setValue('견적서번호:');
    sheet.getRange('B3').setValue(estimateId);
    sheet.getRange('A4').setValue('발행일:');
    sheet.getRange('B4').setValue(Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd'));

    // 예약 정보
    sheet.getRange('A6').setValue('예약자명:');
    sheet.getRange('B6').setValue(estimate['예약자명']);
    sheet.getRange('A7').setValue('예약인원:');
    sheet.getRange('B7').setValue(estimate['예약인원'] + '명');
    sheet.getRange('A8').setValue('체크인:');
    sheet.getRange('B8').setValue(estimate['체크인일']);
    sheet.getRange('A9').setValue('체크아웃:');
    sheet.getRange('B9').setValue(estimate['체크아웃일']);

    // 금액
    sheet.getRange('A11').setValue('총 금액:');
    sheet.getRange('B11').setValue(Number(estimate['총금액']));
    sheet.getRange('A12').setValue('지원금액 (30%):');
    sheet.getRange('B12').setValue(Number(estimate['지원금액']));
    sheet.getRange('A13').setValue('관광객 부담금 (70%):');
    sheet.getRange('B13').setValue(Number(estimate['관광객부담금']));

    // 숙박 경영체
    sheet.getRange('A15').setValue('숙박 경영체:');
    sheet.getRange('B15').setValue(lodging ? lodging['경영체명'] : '');

    // 체험 경영체
    sheet.getRange('A16').setValue('체험 경영체:');
    sheet.getRange('B16').setValue(experience ? experience['경영체명'] : '');

    // 견적서 파일 경로 업데이트
    const fileUrl = file.getUrl();
    const rowNum = findRowIndex(SHEET_NAMES.ESTIMATE, '견적서ID', estimateId);
    if (rowNum > 0) {
      updateRow(SHEET_NAMES.ESTIMATE, rowNum, {
        '견적서파일경로': fileUrl
      });
    }

    return {
      success: true,
      message: '견적서 파일이 생성되었습니다.',
      data: { fileUrl: fileUrl }
    };
  } catch (error) {
    return { success: false, message: '견적서 파일 생성 실패: ' + error.message };
  }
}

function reviewEstimate(estimateId, status, memo) {
  const rowNum = findRowIndex(SHEET_NAMES.ESTIMATE, '견적서ID', estimateId);
  if (rowNum === -1) return { success: false, message: '견적서를 찾을 수 없습니다.' };

  updateRow(SHEET_NAMES.ESTIMATE, rowNum, {
    '검토상태': status,
    '검토일': new Date(),
    '검토자': '관리자'
  });

  // 검토 완료 시 지출계획서 생성
  if (status === '검토완료') {
    generateExpensePlan(estimateId);
  }

  return { success: true, message: '견적서 검토가 완료되었습니다.' };
}

// 지출계획서 생성
function generateExpensePlan(estimateId) {
  try {
    const estimates = getSheetData(SHEET_NAMES.ESTIMATE);
    const estimate = estimates.find(e => e['견적서ID'] === estimateId);
    if (!estimate) return;

    const businesses = getSheetData(SHEET_NAMES.BUSINESS);
    const lodging = businesses.find(b => b['경영체ID'] === estimate['경영체ID_숙박']);

    const seqNum = String(estimates.indexOf(estimate) + 1).padStart(3, '0');
    const fileName = '(농촌지원2026-899-1) 2026년도 지역단위 농촌관광 사업 프로그램 진행 및 지출 계획(' +
                     (lodging ? lodging['경영체명'] : '') + ' ' + seqNum + ')';

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_IDS.EXPENSE_PLANS);
    const newSS = SpreadsheetApp.create(fileName);
    const file = DriveApp.getFileById(newSS.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    // 지출계획서 내용 작성
    const sheet = newSS.getActiveSheet();
    sheet.setName('지출계획서');
    sheet.getRange('A1').setValue('지출계획서').setFontSize(16).setFontWeight('bold');
    sheet.getRange('A3').setValue('사업명: 2026년도 지역단위 농촌관광 사업');
    sheet.getRange('A4').setValue('견적서번호: ' + estimateId);
    sheet.getRange('A5').setValue('경영체: ' + (lodging ? lodging['경영체명'] : ''));
    sheet.getRange('A6').setValue('지출금액: ' + estimate['지원금액'] + '원');

    // 견적서에 지출계획서 경로 업데이트
    const rowNum = findRowIndex(SHEET_NAMES.ESTIMATE, '견적서ID', estimateId);
    if (rowNum > 0) {
      updateRow(SHEET_NAMES.ESTIMATE, rowNum, {
        '지출계획서경로': file.getUrl()
      });
    }
  } catch (error) {
    Logger.log('지출계획서 생성 오류: ' + error.message);
  }
}

// ========== 청구서 관리 ==========
function getInvoiceList(businessId) {
  let data = getSheetData(SHEET_NAMES.INVOICE);
  if (businessId) {
    data = data.filter(inv => inv['경영체ID'] === businessId);
  }
  return { success: true, data: data };
}

function saveInvoice(data) {
  if (data['청구서ID']) {
    const rowNum = findRowIndex(SHEET_NAMES.INVOICE, '청구서ID', data['청구서ID']);
    if (rowNum === -1) return { success: false, message: '청구서를 찾을 수 없습니다.' };
    updateRow(SHEET_NAMES.INVOICE, rowNum, data);
    return { success: true, message: '청구서가 수정되었습니다.' };
  } else {
    data['청구서ID'] = generateId('INV');
    data['제출일'] = new Date();
    data['검토상태'] = '미검토';
    appendRow(SHEET_NAMES.INVOICE, data);
    return { success: true, message: '청구서가 제출되었습니다.' };
  }
}

function reviewInvoice(invoiceId, status, memo) {
  const rowNum = findRowIndex(SHEET_NAMES.INVOICE, '청구서ID', invoiceId);
  if (rowNum === -1) return { success: false, message: '청구서를 찾을 수 없습니다.' };

  updateRow(SHEET_NAMES.INVOICE, rowNum, {
    '검토상태': status,
    '검토결과메모': memo || '',
    '검토일': new Date(),
    '검토자': '관리자'
  });

  return { success: true, message: '청구서 검토가 완료되었습니다.' };
}

// ========== 프로그램비 지급 관리 ==========
function getPaymentList(businessId) {
  let data = getSheetData(SHEET_NAMES.PAYMENT);
  if (businessId) {
    data = data.filter(p => p['경영체ID'] === businessId);
  }
  return { success: true, data: data };
}

function processPayment(data) {
  if (data['지급ID']) {
    const rowNum = findRowIndex(SHEET_NAMES.PAYMENT, '지급ID', data['지급ID']);
    if (rowNum === -1) return { success: false, message: '지급정보를 찾을 수 없습니다.' };
    updateRow(SHEET_NAMES.PAYMENT, rowNum, data);
    return { success: true, message: '지급정보가 수정되었습니다.' };
  } else {
    data['지급ID'] = generateId('PAY');
    data['결제수단'] = data['결제수단'] || '이나라도움카드';
    data['결제상태'] = data['결제상태'] || '미결제';
    appendRow(SHEET_NAMES.PAYMENT, data);
    return { success: true, message: '지급정보가 등록되었습니다.' };
  }
}

// ========== 공동마케팅비 납부관리 ==========
function getMarketingFeeList(businessId) {
  let data = getSheetData(SHEET_NAMES.MARKETING_FEE);
  if (businessId) {
    data = data.filter(f => f['경영체ID'] === businessId);
  }
  return { success: true, data: data };
}

function updateMarketingFee(data) {
  if (data['납부ID']) {
    const rowNum = findRowIndex(SHEET_NAMES.MARKETING_FEE, '납부ID', data['납부ID']);
    if (rowNum === -1) return { success: false, message: '납부정보를 찾을 수 없습니다.' };
    updateRow(SHEET_NAMES.MARKETING_FEE, rowNum, data);
    return { success: true, message: '납부정보가 수정되었습니다.' };
  } else {
    data['납부ID'] = generateId('MKT');
    data['입금상태'] = data['입금상태'] || '미입금';
    if (data['판매총액']) {
      data['납부금액'] = Math.round(Number(data['판매총액']) * MARKETING_FEE_RATE);
    }
    appendRow(SHEET_NAMES.MARKETING_FEE, data);
    return { success: true, message: '납부정보가 등록되었습니다.' };
  }
}

function generateDepositReceipt(feeId) {
  try {
    const fees = getSheetData(SHEET_NAMES.MARKETING_FEE);
    const fee = fees.find(f => f['납부ID'] === feeId);
    if (!fee) return { success: false, message: '납부정보를 찾을 수 없습니다.' };

    const businesses = getSheetData(SHEET_NAMES.BUSINESS);
    const biz = businesses.find(b => b['경영체ID'] === fee['경영체ID']);

    const fileName = '입금확인증_' + (biz ? biz['경영체명'] : '') + '_' + fee['대상월'];
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_IDS.INVOICES);
    const newSS = SpreadsheetApp.create(fileName);
    const file = DriveApp.getFileById(newSS.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);

    const sheet = newSS.getActiveSheet();
    sheet.setName('입금확인증');
    sheet.getRange('A1').setValue('입금확인증').setFontSize(16).setFontWeight('bold');
    sheet.getRange('A3').setValue('경영체: ' + (biz ? biz['경영체명'] : ''));
    sheet.getRange('A4').setValue('대상월: ' + fee['대상월']);
    sheet.getRange('A5').setValue('납부금액: ' + Number(fee['납부금액']).toLocaleString() + '원');
    sheet.getRange('A6').setValue('입금일: ' + fee['입금일']);
    sheet.getRange('A8').setValue('위 금액을 정히 입금하였음을 확인합니다.');
    sheet.getRange('A10').setValue(Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy년 MM월 dd일'));

    const rowNum = findRowIndex(SHEET_NAMES.MARKETING_FEE, '납부ID', feeId);
    if (rowNum > 0) {
      updateRow(SHEET_NAMES.MARKETING_FEE, rowNum, { '입금확인증경로': file.getUrl() });
    }

    return { success: true, message: '입금확인증이 생성되었습니다.', data: { fileUrl: file.getUrl() } };
  } catch (error) {
    return { success: false, message: '입금확인증 생성 실패: ' + error.message };
  }
}

// ========== 회비 납부관리 ==========
function getMembershipFeeList(businessId) {
  let data = getSheetData(SHEET_NAMES.MEMBERSHIP_FEE);
  if (businessId) {
    data = data.filter(f => f['경영체ID'] === businessId);
  }
  return { success: true, data: data };
}

function updateMembershipFee(data) {
  if (data['회비ID']) {
    const rowNum = findRowIndex(SHEET_NAMES.MEMBERSHIP_FEE, '회비ID', data['회비ID']);
    if (rowNum === -1) return { success: false, message: '회비정보를 찾을 수 없습니다.' };
    updateRow(SHEET_NAMES.MEMBERSHIP_FEE, rowNum, data);
    return { success: true, message: '회비정보가 수정되었습니다.' };
  } else {
    data['회비ID'] = generateId('MBR');
    data['입금상태'] = data['입금상태'] || '미입금';
    appendRow(SHEET_NAMES.MEMBERSHIP_FEE, data);
    return { success: true, message: '회비정보가 등록되었습니다.' };
  }
}

// ========== 행사 관리 ==========
function getEventList() {
  const data = getSheetData(SHEET_NAMES.EVENT);
  return { success: true, data: data };
}

function saveEvent(data) {
  if (data['행사ID']) {
    const rowNum = findRowIndex(SHEET_NAMES.EVENT, '행사ID', data['행사ID']);
    if (rowNum === -1) return { success: false, message: '행사를 찾을 수 없습니다.' };
    updateRow(SHEET_NAMES.EVENT, rowNum, data);
    return { success: true, message: '행사가 수정되었습니다.' };
  } else {
    data['행사ID'] = generateId('EVT');
    data['등록일'] = new Date();
    appendRow(SHEET_NAMES.EVENT, data);

    // 모든 활성 경영체에 참석자 레코드 생성
    const businesses = getSheetData(SHEET_NAMES.BUSINESS).filter(b => b['상태'] === '활성');
    businesses.forEach(biz => {
      appendRow(SHEET_NAMES.EVENT_ATTENDEE, {
        '참석ID': generateId('ATT'),
        '행사ID': data['행사ID'],
        '경영체ID': biz['경영체ID'],
        '참석여부': false,
        '비고': ''
      });
    });

    return { success: true, message: '행사가 등록되었습니다.' };
  }
}

function getEventAttendees(eventId) {
  let data = getSheetData(SHEET_NAMES.EVENT_ATTENDEE);
  data = data.filter(a => a['행사ID'] === eventId);

  // 경영체명 추가
  const businesses = getSheetData(SHEET_NAMES.BUSINESS);
  data = data.map(a => {
    const biz = businesses.find(b => b['경영체ID'] === a['경영체ID']);
    return { ...a, '경영체명': biz ? biz['경영체명'] : '' };
  });

  return { success: true, data: data };
}

function updateAttendance(eventId, businessId, attended) {
  const attendees = getSheetData(SHEET_NAMES.EVENT_ATTENDEE);
  const att = attendees.find(a => a['행사ID'] === eventId && a['경영체ID'] === businessId);
  if (!att) return { success: false, message: '참석 정보를 찾을 수 없습니다.' };

  const rowNum = findRowIndex(SHEET_NAMES.EVENT_ATTENDEE, '참석ID', att['참석ID']);
  if (rowNum > 0) {
    updateRow(SHEET_NAMES.EVENT_ATTENDEE, rowNum, { '참석여부': attended });
  }
  return { success: true, message: '참석여부가 수정되었습니다.' };
}

// ========== 대시보드 ==========
function getDashboardStats(businessId) {
  const businesses = getSheetData(SHEET_NAMES.BUSINESS);
  const reservations = getSheetData(SHEET_NAMES.RESERVATION);
  const estimates = getSheetData(SHEET_NAMES.ESTIMATE);
  const invoices = getSheetData(SHEET_NAMES.INVOICE);
  const payments = getSheetData(SHEET_NAMES.PAYMENT);

  if (businessId) {
    // 경영체용 대시보드
    const myReservations = reservations.filter(r => r['경영체ID'] === businessId);
    const myEstimates = estimates.filter(e => e['경영체ID_숙박'] === businessId || e['경영체ID_체험'] === businessId);
    const myInvoices = invoices.filter(inv => inv['경영체ID'] === businessId);
    const myPayments = payments.filter(p => p['경영체ID'] === businessId);

    return {
      success: true,
      data: {
        totalReservations: myReservations.length,
        unprocessedReservations: myReservations.filter(r => r['견적서처리여부'] === '미처리').length,
        pendingEstimates: myEstimates.filter(e => e['검토상태'] === '미검토').length,
        pendingInvoices: myInvoices.filter(inv => inv['검토상태'] !== '검토완료').length,
        totalPayments: myPayments.filter(p => p['결제상태'] === '결제완료').reduce((sum, p) => sum + Number(p['지급금액'] || 0), 0),
        supplementRequests: myInvoices.filter(inv => inv['검토상태'] === '보완요청').length
      }
    };
  } else {
    // 관리자용 대시보드
    return {
      success: true,
      data: {
        totalBusinesses: businesses.filter(b => b['상태'] === '활성').length,
        totalReservations: reservations.length,
        unprocessedReservations: reservations.filter(r => r['견적서처리여부'] === '미처리').length,
        pendingEstimateReview: estimates.filter(e => e['검토상태'] === '미검토').length,
        pendingInvoiceReview: invoices.filter(inv => inv['검토상태'] === '미검토').length,
        unpaidPayments: payments.filter(p => p['결제상태'] === '미결제').length,
        totalSupportAmount: payments.filter(p => p['결제상태'] === '결제완료').reduce((sum, p) => sum + Number(p['지급금액'] || 0), 0)
      }
    };
  }
}

// ========== 파일 업로드 ==========
function uploadFile(fileBase64, fileName, folderId) {
  try {
    const decoded = Utilities.base64Decode(fileBase64);
    const blob = Utilities.newBlob(decoded, 'application/octet-stream', fileName);

    const folder = DriveApp.getFolderById(folderId || DRIVE_FOLDER_IDS.PHOTOS);
    const file = folder.createFile(blob);

    return {
      success: true,
      message: '파일이 업로드되었습니다.',
      data: {
        fileId: file.getId(),
        fileUrl: file.getUrl(),
        fileName: file.getName()
      }
    };
  } catch (error) {
    return { success: false, message: '파일 업로드 실패: ' + error.message };
  }
}

// ========== 초기 시트 생성 (최초 1회 실행) ==========
function initializeSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const sheetsConfig = {
    '경영체_기본정보': ['경영체ID','비밀번호','사업자등록번호','경영체명','대표자명','연락처','이메일','주소','경영체유형','네이버플레이스URL','네이버플레이스ID','대표이미지URL','소개글','등록일','상태','권한'],
    '프로그램_정보': ['프로그램ID','경영체ID','프로그램유형','프로그램명','설명','정가','지원금액','관광객부담금','최소인원','최대인원','운영기간시작','운영기간종료','이미지URLs','상태','등록일'],
    '로그인_기록': ['로그ID','경영체ID','로그인시간','로그아웃시간','IP주소','디바이스정보'],
    '예약정보_크롤링': ['크롤링ID','경영체ID','예약번호','예약자명','예약자연락처','예약인원','체크인일','체크아웃일','예약상품명','예약금액','예약상태','크롤링일시','견적서처리여부','수동입력여부'],
    '견적서_관리': ['견적서ID','크롤링ID','경영체ID_숙박','경영체ID_체험','예약자명','예약인원','체크인일','체크아웃일','숙박프로그램ID','체험프로그램IDs','식사프로그램IDs','총금액','지원금액','관광객부담금','견적서파일경로','견적서이미지경로','발행일','검토상태','검토일','검토자','지출계획서경로'],
    '청구서_관리': ['청구서ID','견적서ID','경영체ID','경영체유형','참석자명부경로','체험사진경로들','제출일','검토상태','검토결과메모','검토일','검토자'],
    '프로그램비_지급관리': ['지급ID','청구서ID','경영체ID','지급금액','결제수단','결제일','결제상태','비고'],
    '공동마케팅비_납부관리': ['납부ID','경영체ID','대상월','판매총액','납부금액','납부기한','입금일','입금상태','입금확인증경로'],
    '회비_납부관리': ['회비ID','경영체ID','대상월','납부금액','입금일','입금상태','비고'],
    '행사_참여관리': ['행사ID','행사명','행사유형','행사일시','장소','참석대상','등록일'],
    '행사_참석자': ['참석ID','행사ID','경영체ID','참석여부','비고']
  };

  Object.keys(sheetsConfig).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    // 헤더 설정
    const headers = sheetsConfig[name];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E8F5E9');
    sheet.setFrozenRows(1);
  });

  // 기본 시트(Sheet1) 삭제
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  // 관리자 계정 생성 (초기)
  const bizSheet = ss.getSheetByName('경영체_기본정보');
  if (bizSheet.getLastRow() <= 1) {
    const adminData = ['ADM-001', hashPassword('admin1234'), '', '시스템관리자', '관리자', '01000000000', '', '', '관리', '', '', '', '', new Date(), '활성', 'admin'];
    bizSheet.appendRow(adminData);
  }

  Logger.log('시트 초기화 완료');
}
