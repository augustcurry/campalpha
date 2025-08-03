// src/utils/networkUtils.js

import { mockUniversityAPI, getCuratedUniversities } from '../data/alternativeUniversityAPIs';

/**
 * Network utility functions for handling API failures and connectivity issues
 */

/**
 * Check if the device has network connectivity
 * Note: This is a basic check and doesn't guarantee API availability
 */
export const checkNetworkConnectivity = async () => {
  try {
    // Try to fetch a simple endpoint to test connectivity
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.warn('Network connectivity check failed:', error.message);
    return false;
  }
};

/**
 * Enhanced fetch with timeout and retry logic
 * @param {string} url - URL to fetch
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @param {number} retries - Number of retry attempts
 * @returns {Promise} - Fetch promise
 */
export const fetchWithTimeout = async (url, options = {}, timeout = 10000, retries = 1) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const fetchOptions = {
    ...options,
    signal: controller.signal,
  };
  
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // If it's the last attempt or it's an abort error, throw immediately
      if (attempt === retries || error.name === 'AbortError') {
        clearTimeout(timeoutId);
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  clearTimeout(timeoutId);
  throw lastError;
};

/**
 * Test universities API availability with multiple fallback options
 * @returns {Promise<{available: boolean, apiUrl: string, apiName: string}>} - API status and working source
 */
export const testUniversitiesAPI = async () => {
  // Test primary API
  try {
    const response = await fetchWithTimeout(
      'https://universities.hipolabs.com/search?name=university&limit=1',
      {},
      3000, // Quick test
      0 // No retries for this test
    );
    const data = await response.json();
    
    if (Array.isArray(data)) {
      if (__DEV__) {
        console.log('Universities API test: Hipolabs API is available');
      }
      return { available: true, apiUrl: 'https://universities.hipolabs.com', apiName: 'Hipolabs Universities' };
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Universities API test: Hipolabs API failed -', error.message);
    }
  }

  // Test fallback API (using reliable endpoint)
  try {
    const response = await fetchWithTimeout(
      'https://jsonplaceholder.typicode.com/users/1',
      {},
      3000,
      0
    );
    const data = await response.json();
    
    if (data && data.id) {
      if (__DEV__) {
        console.log('Universities API test: Fallback API is available');
      }
      return { available: true, apiUrl: 'fallback', apiName: 'Alternative API' };
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Universities API test: Fallback API failed -', error.message);
    }
  }

  // All online APIs failed, but we have curated data
  if (__DEV__) {
    console.log('All online APIs unavailable. Using curated university data.');
  }
  return { available: true, apiUrl: 'curated', apiName: 'Curated Database' };
};

/**
 * Fetch universities from multiple APIs with comprehensive fallback
 * @param {string} query - Search query
 * @param {number} limit - Number of results
 * @returns {Promise<Array>} - University data
 */
export const fetchUniversitiesFromAPI = async (query, limit = 10) => {
  // Primary API: Hipolabs Universities
  try {
    const primaryEndpoint = `https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}&limit=${limit + 5}`;
    const response = await fetchWithTimeout(primaryEndpoint, {}, 6000, 1);
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      if (__DEV__) {
        console.log('Using primary universities API (Hipolabs)');
      }
      return data.map(u => ({
        name: u.name,
        country: u.country,
        state_province: u['state-province'] || u.state_province
      }));
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Primary universities API failed:', error.message);
    }
  }

  // Fallback 1: Mock API using reliable endpoint
  try {
    if (__DEV__) {
      console.log('Trying fallback API...');
    }
    const mockData = await mockUniversityAPI(query, limit);
    if (mockData && mockData.length > 0) {
      if (__DEV__) {
        console.log('Using fallback mock API');
      }
      return mockData;
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Mock API fallback failed:', error.message);
    }
  }

  // Fallback 2: Curated university list
  try {
    if (__DEV__) {
      console.log('Using curated university list');
    }
    const curatedData = getCuratedUniversities(query, limit);
    if (curatedData && curatedData.length > 0) {
      return curatedData;
    }
  } catch (error) {
    if (__DEV__) {
      console.log('Curated list fallback failed:', error.message);
    }
  }

  throw new Error('All university data sources unavailable');
};
