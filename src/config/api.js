const API_CONFIG = {
  getBaseUrl: () => {
    // Check if we're running on the same server as the API
    if (typeof window !== 'undefined' && window.location.hostname === '34.230.51.109') {
      return 'http://34.230.51.109:4000'; // Same server, different port
    }
    
    // For local development
    if (process.env.NODE_ENV === 'development') {
      return process.env.REACT_APP_API_URL || 'http://localhost:4000';
    }
    
    // Production fallback
    return process.env.REACT_APP_API_URL || 'http://34.230.51.109:4000';
  },
  
  getApiUrl: () => {
    return `${API_CONFIG.getBaseUrl()}/api`;
  },
  
  TIMEOUT: 30000,
};

export default API_CONFIG;