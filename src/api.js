// config/api.js - Simple configuration

const API_CONFIG = {
  // Get the API base URL based on environment
  getBaseUrl: () => {
    // If we have an environment variable, use it
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    // Otherwise, use the default
    return 'http://34.230.51.109:4000';
  },
  
  // Get full API URL with /api path
  getApiUrl: () => {
    return `${API_CONFIG.getBaseUrl()}/api`;
  },
  
  // Timeout for requests
  TIMEOUT: 10000
};

export default API_CONFIG;