// src/data/alternativeUniversityAPIs.js

/**
 * Alternative university data sources and APIs
 * These provide fallback options when the primary API is unavailable
 */

/**
 * Mock university API using a reliable endpoint
 * This demonstrates how to integrate with alternative APIs
 */
export const mockUniversityAPI = async (query, limit = 10) => {
  try {
    // Using JSONPlaceholder as a stable test endpoint
    // In practice, you'd use a real university API here
    const response = await fetch('https://jsonplaceholder.typicode.com/users');
    const users = await response.json();
    
    // Transform user data into mock university data
    const mockUniversities = users.map(user => ({
      name: `${user.company.name} University`,
      country: 'United States',
      state_province: user.address.city,
      website: `https://${user.company.name.toLowerCase().replace(/\s+/g, '')}.edu`,
      domains: [`${user.company.name.toLowerCase().replace(/\s+/g, '')}.edu`]
    }));
    
    // Filter based on query
    const filtered = mockUniversities.filter(uni => 
      uni.name.toLowerCase().includes(query.toLowerCase()) ||
      uni.state_province.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered.slice(0, limit);
  } catch (error) {
    throw new Error('Mock API failed: ' + error.message);
  }
};

/**
 * Curated list of popular universities by region
 * This serves as a reliable fallback when all APIs fail
 */
export const getCuratedUniversities = (query, limit = 10) => {
  const curatedList = [
    // United States - Top Universities
    { name: 'Harvard University', country: 'United States', state_province: 'Massachusetts' },
    { name: 'Stanford University', country: 'United States', state_province: 'California' },
    { name: 'Massachusetts Institute of Technology', country: 'United States', state_province: 'Massachusetts' },
    { name: 'University of California, Berkeley', country: 'United States', state_province: 'California' },
    { name: 'Yale University', country: 'United States', state_province: 'Connecticut' },
    { name: 'Princeton University', country: 'United States', state_province: 'New Jersey' },
    { name: 'Columbia University', country: 'United States', state_province: 'New York' },
    { name: 'University of Chicago', country: 'United States', state_province: 'Illinois' },
    { name: 'University of Pennsylvania', country: 'United States', state_province: 'Pennsylvania' },
    { name: 'California Institute of Technology', country: 'United States', state_province: 'California' },
    
    // United Kingdom
    { name: 'University of Oxford', country: 'United Kingdom', state_province: 'England' },
    { name: 'University of Cambridge', country: 'United Kingdom', state_province: 'England' },
    { name: 'Imperial College London', country: 'United Kingdom', state_province: 'England' },
    { name: 'London School of Economics', country: 'United Kingdom', state_province: 'England' },
    { name: 'University College London', country: 'United Kingdom', state_province: 'England' },
    
    // Canada
    { name: 'University of Toronto', country: 'Canada', state_province: 'Ontario' },
    { name: 'McGill University', country: 'Canada', state_province: 'Quebec' },
    { name: 'University of British Columbia', country: 'Canada', state_province: 'British Columbia' },
    
    // Australia
    { name: 'University of Melbourne', country: 'Australia', state_province: 'Victoria' },
    { name: 'University of Sydney', country: 'Australia', state_province: 'New South Wales' },
    { name: 'Australian National University', country: 'Australia', state_province: 'Australian Capital Territory' },
    
    // Europe
    { name: 'ETH Zurich', country: 'Switzerland', state_province: 'Zurich' },
    { name: 'University of Amsterdam', country: 'Netherlands', state_province: 'North Holland' },
    { name: 'Sorbonne University', country: 'France', state_province: 'Île-de-France' },
    { name: 'Technical University of Munich', country: 'Germany', state_province: 'Bavaria' },
    
    // Asia
    { name: 'University of Tokyo', country: 'Japan', state_province: 'Tokyo' },
    { name: 'National University of Singapore', country: 'Singapore', state_province: 'Singapore' },
    { name: 'Tsinghua University', country: 'China', state_province: 'Beijing' },
    { name: 'Peking University', country: 'China', state_province: 'Beijing' },
  ];
  
  const queryLower = query.toLowerCase();
  const filtered = curatedList.filter(uni => 
    uni.name.toLowerCase().includes(queryLower) ||
    uni.country.toLowerCase().includes(queryLower) ||
    uni.state_province.toLowerCase().includes(queryLower)
  );
  
  return filtered
    .sort((a, b) => {
      // Prioritize name matches over location matches
      const aNameMatch = a.name.toLowerCase().includes(queryLower);
      const bNameMatch = b.name.toLowerCase().includes(queryLower);
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
};
