// src/data/universities.js

/**
 * Local university database as fallback when API is unavailable
 * Contains popular universities across different countries
 */

export const popularUniversities = [
  // United States - Ivy League & Top Universities
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
  { name: "University of Wisconsin-Green Bay", country: "United States", state: "Wisconsin" },
  
  // Complete University of Wisconsin System
  { name: "University of Wisconsin-Milwaukee", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-Eau Claire", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-La Crosse", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-Oshkosh", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-Platteville", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-River Falls", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-Stevens Point", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-Stout", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-Superior", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-Whitewater", country: "United States", state: "Wisconsin" },
  { name: "University of Wisconsin-Parkside", country: "United States", state: "Wisconsin" },
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

  // Additional Popular US Universities
  { name: "Boston University", country: "United States", state: "Massachusetts" },
  { name: "Boston College", country: "United States", state: "Massachusetts" },
  { name: "Northeastern University", country: "United States", state: "Massachusetts" },
  { name: "Tufts University", country: "United States", state: "Massachusetts" },
  { name: "Carnegie Mellon University", country: "United States", state: "Pennsylvania" },
  { name: "University of Southern California", country: "United States", state: "California" },
  { name: "Wake Forest University", country: "United States", state: "North Carolina" },
  { name: "University of Miami", country: "United States", state: "Florida" },
  { name: "Tulane University", country: "United States", state: "Louisiana" },
  { name: "University of Rochester", country: "United States", state: "New York" },
  { name: "Case Western Reserve University", country: "United States", state: "Ohio" },
  { name: "Brandeis University", country: "United States", state: "Massachusetts" },
  { name: "University of California, Santa Cruz", country: "United States", state: "California" },
  { name: "University of California, Riverside", country: "United States", state: "California" },
  { name: "University of California, Merced", country: "United States", state: "California" },
  { name: "Florida State University", country: "United States", state: "Florida" },
  { name: "Florida International University", country: "United States", state: "Florida" },
  { name: "University of Central Florida", country: "United States", state: "Florida" },
  { name: "Miami University", country: "United States", state: "Ohio" },
  { name: "Indiana University", country: "United States", state: "Indiana" },
  { name: "University of Iowa", country: "United States", state: "Iowa" },
  { name: "Iowa State University", country: "United States", state: "Iowa" },
  { name: "University of Kansas", country: "United States", state: "Kansas" },
  { name: "Kansas State University", country: "United States", state: "Kansas" },
  { name: "University of Kentucky", country: "United States", state: "Kentucky" },
  { name: "University of Louisville", country: "United States", state: "Kentucky" },
  { name: "Louisiana State University", country: "United States", state: "Louisiana" },
  { name: "University of Maine", country: "United States", state: "Maine" },
  { name: "University of Maryland", country: "United States", state: "Maryland" },
  { name: "University of Massachusetts Amherst", country: "United States", state: "Massachusetts" },
  { name: "Michigan State University", country: "United States", state: "Michigan" },
  { name: "University of Minnesota", country: "United States", state: "Minnesota" },
  { name: "University of Mississippi", country: "United States", state: "Mississippi" },
  { name: "Mississippi State University", country: "United States", state: "Mississippi" },
  { name: "University of Missouri", country: "United States", state: "Missouri" },
  { name: "Washington University in St. Louis", country: "United States", state: "Missouri" },
  { name: "University of Montana", country: "United States", state: "Montana" },
  { name: "University of Nebraska", country: "United States", state: "Nebraska" },
  { name: "University of Nevada Las Vegas", country: "United States", state: "Nevada" },
  { name: "University of Nevada Reno", country: "United States", state: "Nevada" },
  { name: "University of New Hampshire", country: "United States", state: "New Hampshire" },
  { name: "Dartmouth College", country: "United States", state: "New Hampshire" },
  { name: "Rutgers University", country: "United States", state: "New Jersey" },
  { name: "University of New Mexico", country: "United States", state: "New Mexico" },
  { name: "Rochester Institute of Technology", country: "United States", state: "New York" },
  { name: "Rensselaer Polytechnic Institute", country: "United States", state: "New York" },
  { name: "State University of New York at Albany", country: "United States", state: "New York" },
  { name: "State University of New York at Stony Brook", country: "United States", state: "New York" },
  { name: "University of North Dakota", country: "United States", state: "North Dakota" },
  { name: "North Dakota State University", country: "United States", state: "North Dakota" },
  { name: "University of Oklahoma", country: "United States", state: "Oklahoma" },
  { name: "Oklahoma State University", country: "United States", state: "Oklahoma" },
  { name: "University of Oregon", country: "United States", state: "Oregon" },
  { name: "Oregon State University", country: "United States", state: "Oregon" },
  { name: "Portland State University", country: "United States", state: "Oregon" },
  { name: "Temple University", country: "United States", state: "Pennsylvania" },
  { name: "University of Pittsburgh", country: "United States", state: "Pennsylvania" },
  { name: "Drexel University", country: "United States", state: "Pennsylvania" },
  { name: "Brown University", country: "United States", state: "Rhode Island" },
  { name: "University of Rhode Island", country: "United States", state: "Rhode Island" },
  { name: "University of South Carolina", country: "United States", state: "South Carolina" },
  { name: "Clemson University", country: "United States", state: "South Carolina" },
  { name: "University of South Dakota", country: "United States", state: "South Dakota" },
  { name: "South Dakota State University", country: "United States", state: "South Dakota" },
  { name: "University of Tennessee", country: "United States", state: "Tennessee" },
  { name: "Tennessee State University", country: "United States", state: "Tennessee" },
  { name: "University of Utah", country: "United States", state: "Utah" },
  { name: "Utah State University", country: "United States", state: "Utah" },
  { name: "Brigham Young University", country: "United States", state: "Utah" },
  { name: "University of Vermont", country: "United States", state: "Vermont" },
  { name: "Virginia Commonwealth University", country: "United States", state: "Virginia" },
  { name: "James Madison University", country: "United States", state: "Virginia" },
  { name: "Washington State University", country: "United States", state: "Washington" },
  { name: "Western Washington University", country: "United States", state: "Washington" },
  { name: "University of West Virginia", country: "United States", state: "West Virginia" },
  { name: "West Virginia University", country: "United States", state: "West Virginia" },
  { name: "University of Wyoming", country: "United States", state: "Wyoming" },
];

/**
 * Get a clean, abbreviated display name for a university
 * @param {string} fullName - Full university name
 * @returns {string} Clean display name
 */
export const getCleanUniversityName = (fullName) => {
  if (!fullName) return '';
  
  // Common abbreviations and clean formats
  const abbreviations = {
    // Ivy League
    'Harvard University': 'Harvard',
    'Stanford University': 'Stanford',
    'Massachusetts Institute of Technology': 'MIT',
    'Yale University': 'Yale',
    'Princeton University': 'Princeton',
    'Columbia University': 'Columbia',
    'University of Pennsylvania': 'UPenn',
    'Dartmouth College': 'Dartmouth',
    'Brown University': 'Brown',
    'Cornell University': 'Cornell',
    
    // Major State Universities - Use common abbreviations
    'University of California, Berkeley': 'UC Berkeley',
    'University of California, Los Angeles': 'UCLA',
    'University of California, San Diego': 'UC San Diego',
    'University of California, Davis': 'UC Davis',
    'University of California, Irvine': 'UC Irvine',
    'University of California, Santa Barbara': 'UC Santa Barbara',
    'University of California, Santa Cruz': 'UC Santa Cruz',
    'University of California, Riverside': 'UC Riverside',
    'University of California, Merced': 'UC Merced',
    
    // Wisconsin System
    'University of Wisconsin-Madison': 'UW-Madison',
    'University of Wisconsin-Milwaukee': 'UW-Milwaukee',
    'University of Wisconsin-Green Bay': 'UW-Green Bay',
    'University of Wisconsin-Eau Claire': 'UW-Eau Claire',
    'University of Wisconsin-La Crosse': 'UW-La Crosse',
    'University of Wisconsin-Oshkosh': 'UW-Oshkosh',
    'University of Wisconsin-Platteville': 'UW-Platteville',
    'University of Wisconsin-River Falls': 'UW-River Falls',
    'University of Wisconsin-Stevens Point': 'UW-Stevens Point',
    'University of Wisconsin-Stout': 'UW-Stout',
    'University of Wisconsin-Superior': 'UW-Superior',
    'University of Wisconsin-Whitewater': 'UW-Whitewater',
    'University of Wisconsin-Parkside': 'UW-Parkside',
    
    // Other Major Universities
    'University of Michigan': 'U of Michigan',
    'University of Texas at Austin': 'UT Austin',
    'University of Florida': 'UF',
    'University of Georgia': 'UGA',
    'Ohio State University': 'Ohio State',
    'Pennsylvania State University': 'Penn State',
    'University of Illinois at Urbana-Champaign': 'UIUC',
    'University of Washington': 'UW',
    'University of North Carolina at Chapel Hill': 'UNC Chapel Hill',
    'Georgia Institute of Technology': 'Georgia Tech',
    'Virginia Polytechnic Institute and State University': 'Virginia Tech',
    
    // California State Universities
    'California State University, Long Beach': 'Cal State Long Beach',
    'California State University, Fullerton': 'Cal State Fullerton',
    'California State University, Northridge': 'Cal State Northridge',
    'San Diego State University': 'San Diego State',
    'San Francisco State University': 'SF State',
    
    // Community Colleges
    'Santa Monica College': 'Santa Monica CC',
    'De Anza College': 'De Anza',
    'Pasadena City College': 'Pasadena CC',
    
    // International
    'University of Oxford': 'Oxford',
    'University of Cambridge': 'Cambridge',
    'Imperial College London': 'Imperial College',
    'London School of Economics': 'LSE',
    'University of Toronto': 'U of Toronto',
    'McGill University': 'McGill',
    'University of British Columbia': 'UBC',
    'Australian National University': 'ANU',
    'University of Melbourne': 'Melbourne',
    'University of Sydney': 'Sydney',
  };
  
  // Check for exact match first
  if (abbreviations[fullName]) {
    return abbreviations[fullName];
  }
  
  // Apply general rules for common patterns
  let cleanName = fullName;
  
  // Remove "The" at the beginning
  cleanName = cleanName.replace(/^The\s+/, '');
  
  // Shorten "University of" to "U of" if not already handled
  if (cleanName.startsWith('University of ') && cleanName.length > 20) {
    cleanName = cleanName.replace(/^University of /, 'U of ');
  }
  
  // If still too long, truncate and add ellipsis
  if (cleanName.length > 25) {
    cleanName = cleanName.substring(0, 22) + '...';
  }
  
  return cleanName;
};

/**
 * Search local university database
 * @param {string} query - Search query
 * @param {number} limit - Maximum results to return
 * @returns {Array} Array of matching universities
 */
export const searchLocalUniversities = (query, limit = 10) => {
  if (!query || query.length < 2) {
    return [];
  }
  
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

/**
 * Email domain mappings for university verification
 * Maps university names to their official email domains
 */
const universityEmailDomains = {
  // Ivy League & Top Universities
  "Harvard University": ["harvard.edu", "college.harvard.edu"],
  "Stanford University": ["stanford.edu"],
  "Massachusetts Institute of Technology": ["mit.edu"],
  "University of California, Berkeley": ["berkeley.edu", "uc.berkeley.edu"],
  "University of California, Los Angeles": ["ucla.edu"],
  "Yale University": ["yale.edu"],
  "Princeton University": ["princeton.edu"],
  "Columbia University": ["columbia.edu"],
  "University of Chicago": ["uchicago.edu"],
  "University of Pennsylvania": ["upenn.edu"],
  "Cornell University": ["cornell.edu"],
  "Duke University": ["duke.edu"],
  "Johns Hopkins University": ["jhu.edu", "jhmi.edu"],
  "Northwestern University": ["northwestern.edu"],
  "Brown University": ["brown.edu"],
  "Vanderbilt University": ["vanderbilt.edu"],
  "Rice University": ["rice.edu"],
  "University of Notre Dame": ["nd.edu"],
  "Emory University": ["emory.edu"],
  "Georgetown University": ["georgetown.edu"],

  // State Universities
  "University of Michigan": ["umich.edu"],
  "University of Virginia": ["virginia.edu"],
  "University of North Carolina at Chapel Hill": ["unc.edu"],
  "University of Texas at Austin": ["utexas.edu"],
  "University of Florida": ["ufl.edu"],
  "University of Georgia": ["uga.edu"],
  
  // University of Wisconsin System
  "University of Wisconsin-Madison": ["wisc.edu"],
  "University of Wisconsin-Milwaukee": ["uwm.edu"],
  "University of Wisconsin-Green Bay": ["uwgb.edu"],
  "University of Wisconsin-Eau Claire": ["uwec.edu"],
  "University of Wisconsin-La Crosse": ["uwlax.edu"],
  "University of Wisconsin-Oshkosh": ["uwosh.edu"],
  "University of Wisconsin-Platteville": ["uwplatt.edu"],
  "University of Wisconsin-River Falls": ["uwrf.edu"],
  "University of Wisconsin-Stevens Point": ["uwsp.edu"],
  "University of Wisconsin-Stout": ["uwstout.edu"],
  "University of Wisconsin-Superior": ["uwsuper.edu"],
  "University of Wisconsin-Whitewater": ["uww.edu"],

  // California State Universities
  "California State University, Long Beach": ["csulb.edu"],
  "California State University, Los Angeles": ["calstatela.edu"],
  "San Diego State University": ["sdsu.edu"],
  "San Francisco State University": ["sfsu.edu"],

  // Tech Schools
  "Georgia Institute of Technology": ["gatech.edu"],
  "Carnegie Mellon University": ["cmu.edu"],
  "California Institute of Technology": ["caltech.edu"],

  // International Universities (common domains)
  "University of Toronto": ["utoronto.ca"],
  "McGill University": ["mcgill.ca"],
  "University of British Columbia": ["ubc.ca"],
  "University of Oxford": ["ox.ac.uk", "oxford.ac.uk"],
  "University of Cambridge": ["cam.ac.uk", "cambridge.ac.uk"],
  "Imperial College London": ["imperial.ac.uk"],
  "University College London": ["ucl.ac.uk"],
  "King's College London": ["kcl.ac.uk"],
  "London School of Economics": ["lse.ac.uk"],
  "University of Edinburgh": ["ed.ac.uk"],

  // Australian Universities
  "University of Melbourne": ["unimelb.edu.au"],
  "University of Sydney": ["sydney.edu.au"],
  "Australian National University": ["anu.edu.au"],
  "University of Queensland": ["uq.edu.au"],
};

/**
 * Get valid email domains for a university
 * @param {string} universityName - Full university name
 * @returns {Array} Array of valid email domains
 */
export const getSchoolEmailDomains = (universityName) => {
  // Direct match
  if (universityEmailDomains[universityName]) {
    return universityEmailDomains[universityName];
  }

  // Try to find partial matches for common university naming patterns
  const normalizedName = universityName.toLowerCase();
  
  // Common fallback patterns
  if (normalizedName.includes('university of california') && normalizedName.includes('berkeley')) {
    return ['berkeley.edu', 'uc.berkeley.edu'];
  }
  if (normalizedName.includes('university of california') && normalizedName.includes('los angeles')) {
    return ['ucla.edu'];
  }
  if (normalizedName.includes('university of wisconsin')) {
    const campus = normalizedName.split('-')[1];
    if (campus === 'madison') return ['wisc.edu'];
    if (campus === 'milwaukee') return ['uwm.edu'];
    // Add more UW campuses as needed
  }

  // Generic fallback - try to construct common domain patterns
  const words = universityName.toLowerCase().split(' ');
  const commonPatterns = [];
  
  if (words.includes('university')) {
    // Pattern: [First word].edu
    if (words[0] !== 'university') {
      commonPatterns.push(`${words[0]}.edu`);
    }
    // Pattern: u[first letter of other words].edu (e.g., University of Michigan -> umich.edu)
    const nonUniversityWords = words.filter(w => w !== 'university' && w !== 'of' && w !== 'the');
    if (nonUniversityWords.length > 0) {
      const initials = nonUniversityWords.map(w => w[0]).join('');
      commonPatterns.push(`u${initials}.edu`);
    }
  }

  // If no patterns found, return a generic pattern
  if (commonPatterns.length === 0) {
    const firstWord = words[0] || 'school';
    commonPatterns.push(`${firstWord}.edu`);
  }

  return commonPatterns;
};
