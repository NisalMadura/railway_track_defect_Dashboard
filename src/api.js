// config/api.js

export const API_CONFIG = {
    // Your API base URL
    BASE_URL: 'http://192.168.1.72:4000/api',
    
    // You can add other API related configuration here
    TIMEOUT: 10000, // 10 seconds timeout
    RETRY_COUNT: 3,
    
   
    
    // Method to get the current environment's URL
    getEnvironmentBaseUrl: function(env = 'development') {
      return this[env]?.BASE_URL || this.BASE_URL;
    }
  };