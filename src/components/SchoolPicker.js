// src/components/SchoolPicker.js

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Autocomplete from 'react-native-autocomplete-input';
import { searchLocalUniversities } from '../data/universities';
import { testUniversitiesAPI, fetchUniversitiesFromAPI } from '../utils/networkUtils';

/**
 * Enhanced School Picker Component with real-time search
 * Uses universities.hipolabs.com API for comprehensive school data
 */
export default function SchoolPicker({ 
  value, 
  onSchoolSelect, 
  placeholder = 'Search for your school...', 
  style,
  inputStyle,
  dropdownStyle,
  disabled = false,
  maxResults = 10
}) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState(null);
  const [useLocalData, setUseLocalData] = useState(false);
  const [apiStatus, setApiStatus] = useState({ available: false, apiName: 'Testing...' });

  // Test API availability on mount
  useEffect(() => {
    testUniversitiesAPI().then(result => {
      setApiStatus(result);
      if (!result.available) {
        setUseLocalData(true);
        if (__DEV__) {
          console.log('SchoolPicker: Using local university database (all APIs unavailable)');
        }
      } else if (__DEV__) {
        console.log(`SchoolPicker: Using ${result.apiName} for university search`);
      }
    }).catch(error => {
      setUseLocalData(true);
      setApiStatus({ available: false, apiName: 'Local Database' });
      if (__DEV__) {
        console.warn('SchoolPicker: API test failed, using local data:', error.message);
      }
    });
  }, []);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (!dropdownVisible || query.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    
    const timeoutId = setTimeout(() => {
      // Try local data first if API has failed before, or use it as immediate fallback
      if (useLocalData) {
        const localResults = searchLocalUniversities(query, maxResults);
        setResults(localResults);
        setLoading(false);
        return;
      }

      let ignore = false;
      
      // Try multiple APIs with fallback
      fetchUniversitiesFromAPI(query, maxResults)
        .then(data => {
          if (!ignore && Array.isArray(data)) {
            // Enhanced sorting: prioritize exact matches, then starts with, then contains
            const sortedResults = data
              .sort((a, b) => {
                const queryLower = query.toLowerCase();
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
              .slice(0, maxResults);
            
            setResults(sortedResults);
            setLoading(false);
          }
        })
        .catch(error => {
          if (!ignore) {
            // Only log API errors in development
            if (__DEV__) {
              console.warn('University API error, falling back to local data:', error.message);
            }
            
            // Fallback to local data
            setUseLocalData(true);
            const localResults = searchLocalUniversities(query, maxResults);
            
            if (localResults.length > 0) {
              setResults(localResults);
              setError(null);
            } else {
              setResults([]);
              setError('Unable to search schools. Please check your connection and try again.');
            }
            setLoading(false);
          }
        });
      
      return () => { ignore = true; };
    }, 400); // Debounce API calls by 400ms

    return () => clearTimeout(timeoutId);
  }, [query, dropdownVisible, maxResults, useLocalData]);

  const handleSelectSchool = (school) => {
    const schoolName = school.name;
    setQuery(schoolName);
    onSchoolSelect?.(schoolName, school);
    setDropdownVisible(false);
    setFocused(false);
    setResults([]);
  };

  const handleTextChange = (text) => {
    setQuery(text);
    onSchoolSelect?.(text, null);
    setDropdownVisible(true);
    setError(null);
    // Reset to API mode when user starts typing again (in case they want to retry)
    if (useLocalData && text.length === 2) {
      setUseLocalData(false);
    }
  };

  const handleFocus = () => {
    if (disabled) return;
    setFocused(true);
    if (query.length >= 2) {
      setDropdownVisible(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding dropdown to allow for item selection
    setTimeout(() => {
      setDropdownVisible(false);
      setFocused(false);
    }, 200);
  };

  const formatSchoolDisplay = (school) => {
    let display = school.name;
    if (school.state_province && school.country === 'United States') {
      display += `, ${school.state_province}`;
    } else if (school.state && school.country === 'United States') {
      display += `, ${school.state}`;
    } else if (school.country && school.country !== 'United States') {
      display += `, ${school.country}`;
    }
    return display;
  };

  const renderSchoolItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.schoolItem, dropdownStyle?.item]}
      onPress={() => handleSelectSchool(item)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name="school" 
        size={16} 
        color="#1DA1F2" 
        style={styles.schoolIcon} 
      />
      <View style={styles.schoolInfo}>
        <Text style={[styles.schoolName, dropdownStyle?.text]} numberOfLines={2}>
          {item.name}
        </Text>
        {(item.state_province || item.state || item.country) && (
          <Text style={[styles.schoolLocation, dropdownStyle?.subtext]} numberOfLines={1}>
            {item.state_province && item.country === 'United States' 
              ? item.state_province 
              : item.state && item.country === 'United States'
              ? item.state
              : item.country}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={[styles.schoolItem, styles.emptyItem]}>
          <ActivityIndicator size="small" color="#1DA1F2" style={styles.schoolIcon} />
          <Text style={[styles.schoolName, styles.emptyText]}>
            Searching schools...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.schoolItem, styles.emptyItem]}>
          <MaterialCommunityIcons 
            name="wifi-off" 
            size={16} 
            color="#FF4444" 
            style={styles.schoolIcon} 
          />
          <View style={styles.errorContainer}>
            <Text style={[styles.schoolName, styles.errorText]}>
              Connection issue
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setUseLocalData(true);
                setError(null);
                const localResults = searchLocalUniversities(query, maxResults);
                setResults(localResults);
              }}
            >
              <Text style={styles.retryText}>Use offline list</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (query.length >= 2) {
      return (
        <View style={[styles.schoolItem, styles.emptyItem]}>
          <MaterialCommunityIcons 
            name="magnify" 
            size={16} 
            color="#8E8E93" 
            style={styles.schoolIcon} 
          />
          <Text style={[styles.schoolName, styles.emptyText]}>
            No schools found for "{query}"
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, style]}>
      <Autocomplete
        data={results}
        value={query}
        onChangeText={handleTextChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        editable={!disabled}
        flatListProps={{
          keyExtractor: (item, idx) => `${item.name}-${item.country}-${idx}`,
          renderItem: renderSchoolItem,
          style: [styles.dropdown, dropdownStyle?.dropdown],
          keyboardShouldPersistTaps: 'handled',
          showsVerticalScrollIndicator: true,
          maxToRenderPerBatch: 5,
          initialNumToRender: 5,
          ListEmptyComponent: renderEmptyComponent,
          ListHeaderComponent: results.length > 0 ? (
            <View style={styles.dataSourceIndicator}>
              <MaterialCommunityIcons 
                name={useLocalData ? "database" : "cloud"} 
                size={12} 
                color="#8E8E93" 
              />
              <Text style={styles.dataSourceText}>
                {useLocalData ? "Local database" : apiStatus.apiName || "Online"}
              </Text>
            </View>
          ) : null,
        }}
        inputContainerStyle={styles.inputContainer}
        listContainerStyle={styles.listContainer}
        containerStyle={styles.autocompleteContainer}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        autoCapitalize="words"
        autoCorrect={false}
        hideResults={!dropdownVisible || (!loading && results.length === 0 && !error && query.length >= 2 ? false : results.length === 0 && !error)}
        style={[
          styles.input,
          inputStyle,
          disabled && styles.inputDisabled,
          focused && styles.inputFocused,
        ]}
      />
      {dropdownVisible && (results.length > 0 || loading || error || query.length >= 2) && (
        <View style={styles.dropdownOverlay} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  autocompleteContainer: {
    flex: 1,
  },
  inputContainer: {
    borderWidth: 0,
  },
  listContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(29, 161, 242, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputFocused: {
    borderColor: '#1DA1F2',
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputDisabled: {
    opacity: 0.6,
    backgroundColor: '#2C2C2E',
  },
  dropdown: {
    maxHeight: 240,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  schoolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#1C1C1E',
  },
  emptyItem: {
    opacity: 0.8,
  },
  schoolIcon: {
    marginRight: 12,
    width: 16,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  schoolLocation: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '400',
  },
  emptyText: {
    color: '#8E8E93',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  errorText: {
    color: '#FF4444',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  errorContainer: {
    flex: 1,
  },
  retryButton: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(29, 161, 242, 0.2)',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: '#1DA1F2',
    fontSize: 12,
    fontWeight: '600',
  },
  dataSourceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dataSourceText: {
    color: '#8E8E93',
    fontSize: 11,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: -1,
  },
});
