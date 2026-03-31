/* ========================================
   유틸리티 함수
   ======================================== */

const Utils = {
  // 날짜 포맷 (YYYY-MM-DD)
  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  // 날짜시간 포맷 (YYYY-MM-DD HH:mm)
  formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return `${this.formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  // 금액 포맷 (콤마)
  formatNumber(num) {
    if (num == null || isNaN(num)) return '0';
    return Number(num).toLocaleString('ko-KR');
  },

  // 금액 포맷 (원)
  formatCurrency(num) {
    return this.formatNumber(num) + '원';
  },

  // 토스트 메시지 표시
  showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  // 로딩 표시/숨기기
  showLoading() {
    let overlay = document.querySelector('.loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="spinner"></div>';
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
  },

  hideLoading() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  // 모달 열기/닫기
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  // 확인 대화상자
  async confirm(message) {
    return window.confirm(message);
  },

  // ID 생성
  generateId(prefix) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${prefix}-${timestamp}${random}`.toUpperCase();
  },

  // 전화번호 포맷
  formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    return phone;
  },

  // 사업자등록번호 포맷
  formatBusinessNumber(num) {
    if (!num) return '';
    const cleaned = num.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{2})(\d{5})/, '$1-$2-$3');
    }
    return num;
  },

  // 지원금액 계산 (30%)
  calcSupportAmount(price) {
    return Math.round(price * CONFIG.SYSTEM.SUPPORT_RATE);
  },

  // 관광객 부담금 계산 (70%)
  calcTouristAmount(price) {
    return price - this.calcSupportAmount(price);
  },

  // 공동마케팅비 계산 (10%)
  calcMarketingFee(totalSales) {
    return Math.round(totalSales * CONFIG.SYSTEM.MARKETING_FEE_RATE);
  },

  // 사이드바 토글 (모바일)
  toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  },

  // 사이드바 닫기
  closeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  },

  // 배지 HTML 생성
  getBadgeHtml(status) {
    const map = {
      '활성': 'success', '비활성': 'default',
      '예약확정': 'info', '취소': 'danger', '완료': 'success',
      '미처리': 'warning', '처리완료': 'success',
      '미검토': 'default', '검토완료': 'success', '보완요청': 'warning',
      '미결제': 'warning', '결제완료': 'success',
      '미입금': 'warning', '입금완료': 'success'
    };
    const type = map[status] || 'default';
    return `<span class="badge badge-${type}">${status}</span>`;
  },

  // 폼 데이터 수집
  getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    const data = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (input.name) {
        if (input.type === 'checkbox') {
          data[input.name] = input.checked;
        } else {
          data[input.name] = input.value.trim();
        }
      }
    });
    return data;
  },

  // 폼 데이터 채우기
  fillForm(formId, data) {
    const form = document.getElementById(formId);
    if (!form || !data) return;
    Object.keys(data).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) {
        if (input.type === 'checkbox') {
          input.checked = data[key];
        } else {
          input.value = data[key] || '';
        }
      }
    });
  },

  // 쿼리스트링 파싱
  getQueryParams() {
    const params = {};
    new URLSearchParams(window.location.search).forEach((val, key) => {
      params[key] = val;
    });
    return params;
  }
};
