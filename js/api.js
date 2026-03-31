/* ========================================
   API 통신 모듈
   Google Apps Script 웹앱과 통신
   ======================================== */

const API = {
  // 기본 요청 함수
  async request(action, params = {}) {
    try {
      const url = CONFIG.API_URL;
      if (!url || url === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        throw new Error('API URL이 설정되지 않았습니다. js/config.js 파일을 확인하세요.');
      }

      const payload = { action, ...params };

      const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || '요청 처리 중 오류가 발생했습니다.');
      }

      return result;
    } catch (error) {
      console.error('API 요청 실패:', error);
      throw error;
    }
  },

  // ========== 인증 ==========
  async login(phone, password) {
    return this.request('login', { phone, password });
  },

  // ========== 경영체 관리 ==========
  async getBusinessList() {
    return this.request('getBusinessList');
  },

  async getBusiness(businessId) {
    return this.request('getBusiness', { businessId });
  },

  async saveBusiness(data) {
    return this.request('saveBusiness', { data });
  },

  async deleteBusiness(businessId) {
    return this.request('deleteBusiness', { businessId });
  },

  // ========== 프로그램 관리 ==========
  async getProgramList(businessId) {
    return this.request('getProgramList', { businessId });
  },

  async saveProgram(data) {
    return this.request('saveProgram', { data });
  },

  async deleteProgram(programId) {
    return this.request('deleteProgram', { programId });
  },

  // ========== 예약 크롤링 ==========
  async getReservations(businessId) {
    return this.request('getReservations', { businessId });
  },

  async saveReservation(data) {
    return this.request('saveReservation', { data });
  },

  async triggerCrawling(businessId) {
    return this.request('triggerCrawling', { businessId });
  },

  // ========== 견적서 관리 ==========
  async getEstimateList(businessId) {
    return this.request('getEstimateList', { businessId });
  },

  async getUnprocessedReservations(businessId) {
    return this.request('getUnprocessedReservations', { businessId });
  },

  async saveEstimate(data) {
    return this.request('saveEstimate', { data });
  },

  async generateEstimateFile(estimateId) {
    return this.request('generateEstimateFile', { estimateId });
  },

  async reviewEstimate(estimateId, status, memo) {
    return this.request('reviewEstimate', { estimateId, status, memo });
  },

  // ========== 청구서 관리 ==========
  async getInvoiceList(businessId) {
    return this.request('getInvoiceList', { businessId });
  },

  async saveInvoice(data) {
    return this.request('saveInvoice', { data });
  },

  async reviewInvoice(invoiceId, status, memo) {
    return this.request('reviewInvoice', { invoiceId, status, memo });
  },

  // ========== 프로그램비 지급 ==========
  async getPaymentList(businessId) {
    return this.request('getPaymentList', { businessId });
  },

  async processPayment(data) {
    return this.request('processPayment', { data });
  },

  // ========== 공동마케팅비 ==========
  async getMarketingFeeList(businessId) {
    return this.request('getMarketingFeeList', { businessId });
  },

  async updateMarketingFee(data) {
    return this.request('updateMarketingFee', { data });
  },

  async generateDepositReceipt(feeId) {
    return this.request('generateDepositReceipt', { feeId });
  },

  // ========== 회비 관리 ==========
  async getMembershipFeeList(businessId) {
    return this.request('getMembershipFeeList', { businessId });
  },

  async updateMembershipFee(data) {
    return this.request('updateMembershipFee', { data });
  },

  // ========== 행사 관리 ==========
  async getEventList() {
    return this.request('getEventList');
  },

  async saveEvent(data) {
    return this.request('saveEvent', { data });
  },

  async getEventAttendees(eventId) {
    return this.request('getEventAttendees', { eventId });
  },

  async updateAttendance(eventId, businessId, attended) {
    return this.request('updateAttendance', { eventId, businessId, attended });
  },

  // ========== 대시보드 ==========
  async getDashboardStats(businessId) {
    return this.request('getDashboardStats', { businessId });
  },

  // ========== 파일 업로드 (Google Drive) ==========
  async uploadFile(fileBase64, fileName, folderId) {
    return this.request('uploadFile', { fileBase64, fileName, folderId });
  }
};
