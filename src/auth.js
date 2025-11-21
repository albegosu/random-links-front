// Auth state management
const AUTH_TOKEN_KEY = 'random_links_token';
const AUTH_USER_KEY = 'random_links_user';

export const auth = {
  // Get stored token
  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  // Get stored user
  getUser() {
    const userStr = localStorage.getItem(AUTH_USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Set auth data
  setAuth(token, user) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  },

  // Clear auth data
  clearAuth() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  },

  // Check if authenticated
  isAuthenticated() {
    return !!this.getToken();
  }
};

