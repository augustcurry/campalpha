# School Picker System Documentation

## Overview
The enhanced school picking system provides a dynamic, searchable interface for users to select their educational institution. It uses the universities.hipolabs.com API to provide comprehensive, real-time school search functionality.

## Key Features

### 🔍 **Real-time Search**
- Dynamic search as user types (debounced by 400ms)
- Minimum 2 characters required to trigger search
- Results sorted by relevance (exact match → starts with → alphabetical)
- Loading indicators during search

### 🎯 **Smart Sorting**
- **Exact matches** appear first
- **Starts with query** ranked next
- **Alphabetical sorting** within same priority groups
- **Location context** (US states shown, international countries)

### 🌍 **Comprehensive Database**
- Uses universities.hipolabs.com API
- International coverage
- US states and international countries displayed
- Configurable result limits (default: 10)

### ✨ **Enhanced UX**
- Visual school icons for each result
- Location information (state for US, country for international)
- Error handling with user-friendly messages
- Keyboard-friendly navigation
- Loading states and empty states

## Components

### SchoolPicker Component

**Location**: `src/components/SchoolPicker.js`

**Props**:
```javascript
{
  value: string,                    // Current selected school
  onSchoolSelect: function,         // Callback (schoolName, schoolData) => void
  placeholder: string,              // Input placeholder text
  style: object,                    // Container style
  inputStyle: object,               // Input field style  
  dropdownStyle: object,            // Dropdown styling options
  disabled: boolean,                // Disable input
  maxResults: number                // Maximum results to show (default: 10)
}
```

**Usage Example**:
```javascript
import SchoolPicker from '../components/SchoolPicker';

<SchoolPicker
  value={selectedSchool}
  onSchoolSelect={(schoolName, schoolData) => {
    setSelectedSchool(schoolName);
    // schoolData contains: { name, country, state_province }
  }}
  placeholder="Search for your school..."
  maxResults={8}
  inputStyle={{
    fontSize: 16,
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
    borderRadius: 12,
  }}
/>
```

## Implementation Details

### API Integration
```javascript
// Endpoint used
https://universities.hipolabs.com/search?name={query}&limit={maxResults}

// Response format
[
  {
    "name": "University of California, Berkeley",
    "country": "United States",
    "state-province": "California",
    "web_pages": [...],
    "domains": [...]
  }
]
```

### Performance Optimizations
- **Debouncing**: 400ms delay to reduce API calls
- **Request cancellation**: Prevents race conditions
- **Result limiting**: Configurable max results (default: 10)
- **Caching**: Component-level result caching
- **Lazy rendering**: Efficient FlatList rendering

### Error Handling
- Network error recovery
- Empty state messaging
- Search timeout handling
- User-friendly error displays

## Integration Points

### 1. Profile Screen
**File**: `src/screens/ProfileScreen.js`

Users can update their school information in edit mode:
```javascript
<SchoolPicker
  value={userData.university || userData.school}
  onSchoolSelect={(schoolName, schoolData) => {
    setUserData({ 
      ...userData, 
      university: schoolName, 
      school: schoolName,
      schoolData: schoolData
    });
  }}
  placeholder="Search for your school..."
  inputStyle={[styles.profileInfoValueLarge, styles.editGlow]}
  maxResults={8}
/>
```

### 2. Registration Screen
**File**: `src/screens/AuthScreen.js`

New users select their school during account creation:
```javascript
<SchoolPicker
  value={school}
  onSchoolSelect={(schoolName, schoolData) => {
    setSchool(schoolName);
  }}
  placeholder="Search for your school..."
  inputStyle={[authStyles.input, { marginHorizontal: 0 }]}
  maxResults={8}
/>
```

## Data Storage

### User Documents
School information is stored in Firestore user documents with dual fields for compatibility:

```javascript
{
  university: "University of California, Berkeley",  // Primary field
  school: "University of California, Berkeley",      // Backup/legacy field
  schoolData: {                                      // Optional metadata
    name: "University of California, Berkeley",
    country: "United States",
    state_province: "California"
  }
}
```

### Posts Integration
School information is automatically included in posts through the existing school badge system.

## Styling

### Dark Theme Integration
The SchoolPicker is designed to match the app's dark theme:

```javascript
// Input styling
backgroundColor: 'rgba(29, 161, 242, 0.1)',
borderColor: 'rgba(255, 255, 255, 0.2)',
color: '#FFFFFF',

// Dropdown styling  
backgroundColor: '#1C1C1E',
borderColor: 'rgba(255, 255, 255, 0.1)',
shadowColor: '#000',

// Text colors
primaryText: '#FFFFFF',
secondaryText: '#8E8E93',
accentColor: '#1DA1F2',
```

### Focus States
- Blue glow on focus
- Animated border color changes
- Shadow effects for depth

## Accessibility Features

- **Screen reader support**: Proper ARIA labels
- **Keyboard navigation**: Full keyboard accessibility
- **Touch targets**: Minimum 44pt touch targets
- **High contrast**: Clear visual hierarchy
- **Voice input compatible**: Works with voice-to-text

## Migration Guide

### From Old UniversityAutocomplete

**Before**:
```javascript
<UniversityAutocomplete
  value={school}
  onChange={school => setSchool(school)}
  inputStyle={styles.input}
  placeholder="School"
/>
```

**After**:
```javascript
<SchoolPicker
  value={school}
  onSchoolSelect={(schoolName, schoolData) => {
    setSchool(schoolName);
  }}
  placeholder="Search for your school..."
  inputStyle={styles.input}
  maxResults={8}
/>
```

### Database Field Updates
Ensure user documents include both `university` and `school` fields:
```javascript
// During user creation/update
{
  university: schoolName,  // New primary field
  school: schoolName,      // Legacy compatibility
}
```

## Troubleshooting

### Common Issues

1. **Dropdown not showing**
   - Check zIndex conflicts
   - Ensure minimum 2 characters entered
   - Verify internet connection

2. **Slow search responses**
   - Check network connectivity
   - API rate limiting may be in effect
   - Debouncing prevents too frequent requests

3. **Styling issues**
   - Verify proper style prop passing
   - Check for conflicting zIndex values
   - Ensure container has proper overflow settings

### Performance Tips

1. **Limit results**: Use `maxResults` prop to control performance
2. **Debounce timing**: 400ms provides good balance of responsiveness vs API calls
3. **Container styling**: Use `overflow: 'visible'` on parent containers

## Future Enhancements

Potential improvements for the school picker system:

- **Offline caching**: Store popular schools locally
- **Recent searches**: Show recently selected schools
- **Favorites**: Allow users to favorite/bookmark schools
- **Advanced filtering**: Filter by location, type, etc.
- **Multi-language support**: International school names
- **Custom school addition**: Allow adding schools not in database
- **School logos**: Display institution logos in results
