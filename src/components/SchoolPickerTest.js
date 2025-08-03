// src/components/SchoolPickerTest.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import SchoolPicker from './SchoolPicker';

/**
 * Test component for SchoolPicker functionality
 * Use this to verify the school picker works correctly
 */
export default function SchoolPickerTest() {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schoolData, setSchoolData] = useState(null);

  const handleSchoolSelect = (schoolName, schoolInfo) => {
    console.log('School selected:', schoolName, schoolInfo);
    setSelectedSchool(schoolName);
    setSchoolData(schoolInfo);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>School Picker Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Select Your School:</Text>
        <SchoolPicker
          value={selectedSchool}
          onSchoolSelect={handleSchoolSelect}
          placeholder="Type to search for schools..."
          style={styles.picker}
        />
      </View>

      {selectedSchool ? (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>Selected School:</Text>
          <Text style={styles.resultText}>Name: {selectedSchool}</Text>
          {schoolData?.country && (
            <Text style={styles.resultText}>Country: {schoolData.country}</Text>
          )}
          {schoolData?.state_province && (
            <Text style={styles.resultText}>State/Province: {schoolData.state_province}</Text>
          )}
        </View>
      ) : (
        <View style={styles.resultSection}>
          <Text style={styles.placeholderText}>No school selected</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#666',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});
