import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; // Note the path is now '../../firebase'
import SimpleSchoolPicker from '../components/SimpleSchoolPicker';

// --- AUTH SCREEN ---
function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const handleAuth = async () => {
    if (!isLogin && (!firstName || !lastName || !username || !school || !major)) {
      setError("Please fill out all fields to sign up.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          username: username,
          email: user.email,
          firstName: firstName,
          lastName: lastName,
          university: school, // Use university field for consistency
          school: school,     // Keep school field for backward compatibility
          major: major,
          birthDate: birthDate,
          createdAt: new Date(),
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <ScrollView contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
        <Text style={authStyles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        {!isLogin && (
          <>
            <TextInput style={authStyles.input} placeholder="First Name" placeholderTextColor="#8E8E93" value={firstName} onChangeText={setFirstName} />
            <TextInput style={authStyles.input} placeholder="Last Name" placeholderTextColor="#8E8E93" value={lastName} onChangeText={setLastName} />
            <TextInput style={authStyles.input} placeholder="Username" placeholderTextColor="#8E8E93" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <View style={{ marginHorizontal: 20, marginBottom: 15, zIndex: 10 }}>
              <SimpleSchoolPicker
                value={school}
                onSchoolSelect={(schoolName) => {
                  setSchool(schoolName);
                }}
                placeholder="Search for your school..."
                style={{ marginHorizontal: 0, marginBottom: 0 }}
                maxResults={12}
                requireVerification={true}
              />
            </View>
            <TextInput style={authStyles.input} placeholder="Major" placeholderTextColor="#8E8E93" value={major} onChangeText={setMajor} />
            <TouchableOpacity style={authStyles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Text style={authStyles.datePickerButtonText}>Date of Birth: {birthDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (<DateTimePicker testID="dateTimePicker" value={birthDate} mode={'date'} display="spinner" onChange={onDateChange}/>)}
          </>
        )}
        <TextInput style={authStyles.input} placeholder="Email" placeholderTextColor="#8E8E93" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={authStyles.input} placeholder="Password" placeholderTextColor="#8E8E93" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={authStyles.button} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={authStyles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={authStyles.switchText}>{isLogin ? 'Need an account? Sign Up' : 'Have an account? Login'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const authStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', alignSelf: 'center', marginBottom: 30 },
  input: { backgroundColor: '#1C1C1E', color: '#fff', paddingHorizontal: 15, paddingVertical: 15, borderRadius: 10, marginBottom: 15, fontSize: 16, marginHorizontal: 20 },
  button: { backgroundColor: '#1DA1F2', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20, marginHorizontal: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { color: '#1DA1F2', alignSelf: 'center' },
  error: { color: 'red', alignSelf: 'center', marginBottom: 10, marginHorizontal: 20 },
  datePickerButton: { backgroundColor: '#1C1C1E', paddingHorizontal: 15, paddingVertical: 15, borderRadius: 10, marginBottom: 15, marginHorizontal: 20, },
  datePickerButtonText: { color: '#fff', fontSize: 16, },
});

export default AuthScreen;
