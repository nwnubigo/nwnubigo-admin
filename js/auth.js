/* ========================================
   인증 (로그인/로그아웃) 모듈
   ======================================== */

const Auth = {
  // 현재 로그인 사용자 정보
  currentUser: null,

  // 세션 초기화
  init() {
    const saved = sessionStorage.getItem('currentUser');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
        // 세션 타임아웃 체크
        const loginTime = this.currentUser.loginTime;
        if (Date.now() - loginTime > CONFIG.SESSION_TIMEOUT) {
          this.logout();
          return false;
        }
        return true;
      } catch {
        this.logout();
        return false;
      }
    }
    return false;
  },

  // 로그인
  async login(phone, password) {
    Utils.showLoading();
    try {
      const result = await API.login(phone, password);
      this.currentUser = {
        ...result.data,
        loginTime: Date.now()
      };
      sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      // 권한에 따라 리다이렉트
      if (this.currentUser.role === 'admin') {
        window.location.href = 'admin/dashboard.html';
      } else {
        window.location.href = 'business/dashboard.html';
      }
    } catch (error) {
      Utils.showToast(error.message, 'error');
    } finally {
      Utils.hideLoading();
    }
  },

  // 로그아웃
  logout() {
    this.currentUser = null;
    sessionStorage.removeItem('currentUser');
    // 로그인 페이지로 이동 (경로 계산)
    const depth = window.location.pathname.split('/').filter(p => p).length;
    const isSubDir = window.location.pathname.includes('/admin/') ||
                     window.location.pathname.includes('/business/');
    if (isSubDir) {
      window.location.href = '../index.html';
    } else {
      window.location.href = 'index.html';
    }
  },

  // 로그인 필요 페이지 체크
  requireAuth(requiredRole) {
    if (!this.init()) {
      this.logout();
      return false;
    }
    if (requiredRole && this.currentUser.role !== requiredRole) {
      Utils.showToast('접근 권한이 없습니다.', 'error');
      this.logout();
      return false;
    }
    return true;
  },

  // 현재 사용자 정보 가져오기
  getUser() {
    return this.currentUser;
  },

  // 관리자 여부
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  },

  // 사용자명
  getUserName() {
    if (!this.currentUser) return '';
    return this.currentUser.businessName || this.currentUser.name || '';
  },

  // 경영체 ID
  getBusinessId() {
    if (!this.currentUser) return '';
    return this.currentUser.businessId || '';
  }
};
