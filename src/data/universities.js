// src/data/universities.js

/**
 * Local university database as fallback when API is unavailable
 * Contains popular universities across different countries
 */

export const popularUniversities = [
  // United States - Major Universities
  { name: "Harvard University", country: "United States", state: "Massachusetts" },
  { name: "Stanford University", country: "United States", state: "California" },
  { name: "Massachusetts Institute of Technology", country: "United States", state: "Massachusetts" },
  { name: "University of California, Berkeley", country: "United States", state: "California" },
  { name: "University of California, Los Angeles", country: "United States", state: "California" },
  { name: "Yale University", country: "United States", state: "Connecticut" },
  { name: "Princeton University", country: "United States", state: "New Jersey" },
  { name: "Columbia University", country: "United States", state: "New York" },
  { name: "University of Chicago", country: "United States", state: "Illinois" },
  { name: "University of Pennsylvania", country: "United States", state: "Pennsylvania" },
  { name: "Cornell University", country: "United States", state: "New York" },
  { name: "Duke University", country: "United States", state: "North Carolina" },
  { name: "Johns Hopkins University", country: "United States", state: "Maryland" },
  { name: "Northwestern University", country: "United States", state: "Illinois" },
  { name: "Brown University", country: "United States", state: "Rhode Island" },
  { name: "Vanderbilt University", country: "United States", state: "Tennessee" },
  { name: "Rice University", country: "United States", state: "Texas" },
  { name: "University of Notre Dame", country: "United States", state: "Indiana" },
  { name: "Emory University", country: "United States", state: "Georgia" },
  { name: "Georgetown University", country: "United States", state: "Washington D.C." },

  // State Universities
  { name: "University of Michigan", country: "United States", state: "Michigan" },
  { name: "University of Virginia", country: "United States", state: "Virginia" },
  { name: "University of North Carolina at Chapel Hill", country: "United States", state: "North Carolina" },
  { name: "University of Texas at Austin", country: "United States", state: "Texas" },
  { name: "University of Florida", country: "United States", state: "Florida" },
  { name: "University of Georgia", country: "United States", state: "Georgia" },
  { name: "University of Wisconsin-Madison", country: "United States", state: "Wisconsin" },
  { name: "Ohio State University", country: "United States", state: "Ohio" },
  { name: "Pennsylvania State University", country: "United States", state: "Pennsylvania" },
  { name: "University of Illinois at Urbana-Champaign", country: "United States", state: "Illinois" },
  { name: "University of Washington", country: "United States", state: "Washington" },
  { name: "University of California, San Diego", country: "United States", state: "California" },
  { name: "University of California, Davis", country: "United States", state: "California" },
  { name: "University of California, Irvine", country: "United States", state: "California" },
  { name: "University of California, Santa Barbara", country: "United States", state: "California" },
  { name: "Georgia Institute of Technology", country: "United States", state: "Georgia" },
  { name: "Virginia Tech", country: "United States", state: "Virginia" },
  { name: "Purdue University", country: "United States", state: "Indiana" },
  { name: "Arizona State University", country: "United States", state: "Arizona" },
  { name: "University of Arizona", country: "United States", state: "Arizona" },

  // California State Universities
  { name: "San Diego State University", country: "United States", state: "California" },
  { name: "California State University, Long Beach", country: "United States", state: "California" },
  { name: "San Francisco State University", country: "United States", state: "California" },
  { name: "California State University, Fullerton", country: "United States", state: "California" },
  { name: "California State University, Northridge", country: "United States", state: "California" },

  // New York Universities
  { name: "New York University", country: "United States", state: "New York" },
  { name: "Fordham University", country: "United States", state: "New York" },
  { name: "Syracuse University", country: "United States", state: "New York" },
  { name: "University at Buffalo", country: "United States", state: "New York" },

  // Texas Universities
  { name: "Texas A&M University", country: "United States", state: "Texas" },
  { name: "University of Houston", country: "United States", state: "Texas" },
  { name: "Texas Tech University", country: "United States", state: "Texas" },
  { name: "Baylor University", country: "United States", state: "Texas" },

  // International Universities
  { name: "University of Oxford", country: "United Kingdom", state: "England" },
  { name: "University of Cambridge", country: "United Kingdom", state: "England" },
  { name: "Imperial College London", country: "United Kingdom", state: "England" },
  { name: "London School of Economics", country: "United Kingdom", state: "England" },
  { name: "University College London", country: "United Kingdom", state: "England" },
  { name: "University of Edinburgh", country: "United Kingdom", state: "Scotland" },
  { name: "King's College London", country: "United Kingdom", state: "England" },

  { name: "University of Toronto", country: "Canada", state: "Ontario" },
  { name: "McGill University", country: "Canada", state: "Quebec" },
  { name: "University of British Columbia", country: "Canada", state: "British Columbia" },
  { name: "University of Waterloo", country: "Canada", state: "Ontario" },
  { name: "McMaster University", country: "Canada", state: "Ontario" },

  { name: "University of Melbourne", country: "Australia", state: "Victoria" },
  { name: "University of Sydney", country: "Australia", state: "New South Wales" },
  { name: "Australian National University", country: "Australia", state: "Australian Capital Territory" },
  { name: "University of Queensland", country: "Australia", state: "Queensland" },
  { name: "Monash University", country: "Australia", state: "Victoria" },

  // European Universities
  { name: "ETH Zurich", country: "Switzerland", state: null },
  { name: "University of Zurich", country: "Switzerland", state: null },
  { name: "Technical University of Munich", country: "Germany", state: "Bavaria" },
  { name: "University of Munich", country: "Germany", state: "Bavaria" },
  { name: "Heidelberg University", country: "Germany", state: "Baden-Württemberg" },
  { name: "Sorbonne University", country: "France", state: "Île-de-France" },
  { name: "École Polytechnique", country: "France", state: "Île-de-France" },
  { name: "University of Amsterdam", country: "Netherlands", state: "North Holland" },
  { name: "Delft University of Technology", country: "Netherlands", state: "South Holland" },
  { name: "KTH Royal Institute of Technology", country: "Sweden", state: "Stockholm" },
  { name: "University of Copenhagen", country: "Denmark", state: null },

  // Asian Universities
  { name: "University of Tokyo", country: "Japan", state: "Tokyo" },
  { name: "Kyoto University", country: "Japan", state: "Kyoto" },
  { name: "Seoul National University", country: "South Korea", state: "Seoul" },
  { name: "KAIST", country: "South Korea", state: "Daejeon" },
  { name: "National University of Singapore", country: "Singapore", state: null },
  { name: "Nanyang Technological University", country: "Singapore", state: null },
  { name: "University of Hong Kong", country: "Hong Kong", state: null },
  { name: "Chinese University of Hong Kong", country: "Hong Kong", state: null },
  { name: "Peking University", country: "China", state: "Beijing" },
  { name: "Tsinghua University", country: "China", state: "Beijing" },
  { name: "Fudan University", country: "China", state: "Shanghai" },
  { name: "Shanghai Jiao Tong University", country: "China", state: "Shanghai" },

  // Community Colleges and Other Institutions
  { name: "Santa Monica College", country: "United States", state: "California" },
  { name: "De Anza College", country: "United States", state: "California" },
  { name: "Foothill College", country: "United States", state: "California" },
  { name: "Pasadena City College", country: "United States", state: "California" },
  { name: "Pierce College", country: "United States", state: "California" },
  { name: "Glendale Community College", country: "United States", state: "California" },
  { name: "Orange Coast College", country: "United States", state: "California" },
  { name: "Diablo Valley College", country: "United States", state: "California" },
];

/**
 * Search local university database
 * @param {string} query - Search query
 * @param {number} limit - Maximum results to return
 * @returns {Array} Array of matching universities
 */
export const searchLocalUniversities = (query, limit = 10) => {
  if (!query || query.length < 2) return [];
  
  const queryLower = query.toLowerCase();
  
  // Filter and sort universities
  const matches = popularUniversities
    .filter(university => 
      university.name.toLowerCase().includes(queryLower)
    )
    .sort((a, b) => {
      const aNameLower = a.name.toLowerCase();
      const bNameLower = b.name.toLowerCase();
      
      // Exact match first
      if (aNameLower === queryLower && bNameLower !== queryLower) return -1;
      if (bNameLower === queryLower && aNameLower !== queryLower) return 1;
      
      // Starts with query
      const aStarts = aNameLower.startsWith(queryLower);
      const bStarts = bNameLower.startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Alphabetical for same priority
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
  
  return matches;
};

/**
 * Get popular universities for a specific country
 * @param {string} country - Country name
 * @param {number} limit - Maximum results to return
 * @returns {Array} Array of universities in the country
 */
export const getUniversitiesByCountry = (country, limit = 20) => {
  return popularUniversities
    .filter(university => university.country === country)
    .slice(0, limit);
};

/**
 * Get popular universities for a specific US state
 * @param {string} state - State name
 * @param {number} limit - Maximum results to return
 * @returns {Array} Array of universities in the state
 */
export const getUniversitiesByState = (state, limit = 20) => {
  return popularUniversities
    .filter(university => 
      university.country === "United States" && 
      university.state === state
    )
    .slice(0, limit);
};
