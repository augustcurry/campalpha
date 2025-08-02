import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Image, KeyboardAvoidingView, Keyboard, Platform, ScrollView, SafeAreaView } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Autocomplete from 'react-native-autocomplete-input';
import { auth, db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot, getDoc, doc as firestoreDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// --- University Autocomplete Component ---
function UniversityAutocomplete({ value, onChange, inputStyle, placeholder }) {
  const [query, setQuery] = React.useState(value || '');
  const [results, setResults] = React.useState([]);
  const [dropdownVisible, setDropdownVisible] = React.useState(false);

  React.useEffect(() => {
    setQuery(value || '');
  }, [value]);

  React.useEffect(() => {
    if (!dropdownVisible || query.length < 2) {
      setResults([]);
      return;
    }
    let ignore = false;
    fetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        if (!ignore) {
          setResults(data.map(u => u.name));
        }
      })
      .catch(() => setResults([]));
    return () => { ignore = true; };
  }, [query, dropdownVisible]);

  return (
    <View style={{ zIndex: 10 }}>
      <Autocomplete
        data={results}
        value={query}
        onChangeText={text => {
          setQuery(text);
          onChange(text);
          setDropdownVisible(true);
        }}
        flatListProps={{
          keyExtractor: (item, idx) => item + idx,
          renderItem: ({ item }) => (
            <TouchableOpacity
              style={{ padding: 10, backgroundColor: '#18181A', borderBottomWidth: 1, borderBottomColor: '#232325' }}
              onPress={() => {
                setQuery(item);
                onChange(item);
                setDropdownVisible(false);
                setResults([]);
              }}
            >
              <Text style={{ color: '#fff' }}>{item}</Text>
            </TouchableOpacity>
          ),
          style: { maxHeight: 120 },
          keyboardShouldPersistTaps: 'handled',
        }}
        inputContainerStyle={{ borderWidth: 0 }}
        listContainerStyle={{ backgroundColor: '#18181A', borderRadius: 8, marginTop: 2, borderWidth: 0 }}
        containerStyle={{}}
        placeholder={placeholder || 'School'}
        placeholderTextColor="#8E8E93"
        autoCapitalize="words"
        hideResults={!dropdownVisible || results.length === 0}
        onBlur={() => setTimeout(() => setDropdownVisible(false), 200)}
        style={inputStyle}
      />
    </View>
  );
}

// --- PROFILE SCREEN ---
function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    // Fetch user info
    getDoc(firestoreDoc(db, 'users', user.uid)).then(docSnap => {
      if (docSnap.exists()) setUserData(docSnap.data());
    });
    // Fetch user's posts
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const posts = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && data.handle && userData && data.handle === `@${userData.username}`) {
          posts.push({ id: doc.id, ...data });
        }
      });
      setUserPosts(posts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userData && userData.username]);

  if (!userData) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;
  }
  // Save profile info to Firestore when exiting edit mode
  const handleEditToggle = async () => {
    if (editing) {
      // Save changes
      try {
        const user = auth.currentUser;
        if (user) {
          await setDoc(firestoreDoc(db, 'users', user.uid), userData, { merge: true });
        }
      } catch (e) {
        alert('Failed to save profile.');
      }
    }
    setEditing(e => !e);
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar with back and edit button */}
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 8, paddingHorizontal: 16, overflow: 'visible'}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 4}}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#1DA1F2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEditToggle}>
          <MaterialCommunityIcons name={editing ? 'check' : 'pencil'} size={28} color="#1DA1F2" />
        </TouchableOpacity>
      </View>
      <View style={{alignItems: 'center', padding: 24, paddingTop: 8, overflow: 'visible'}}>
        {/* Profile Picture with edit option */}
        <View style={editing ? styles.avatarGlow : null}>
          <TouchableOpacity disabled={!editing} onPress={() => {/* TODO: Add image picker logic */}} activeOpacity={editing ? 0.7 : 1}>
            <MaterialCommunityIcons name="account-circle" size={120} color="#8E8E93" />
            {editing && (
              <View style={styles.editPicOverlay}>
                <MaterialCommunityIcons name="camera-plus" size={32} color="#1DA1F2" />
              </View>
            )}
          </TouchableOpacity>
        </View>
        {editing ? (
          <TextInput
            style={[styles.profileInfoValueLarge, styles.editGlow, {color:'#fff', fontSize:24, fontWeight:'bold', marginTop:8, textAlign:'center'}]}
            value={userData.firstName}
            onChangeText={text => setUserData({...userData, firstName: text})}
            placeholder="First Name"
            placeholderTextColor="#8E8E93"
          />
        ) : (
          <Text style={{color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 8}}>{userData.firstName} {userData.lastName}</Text>
        )}
        <Text style={{color: '#8E8E93', fontSize: 16, marginBottom: 12}}>@{userData.username}</Text>
        {/* --- User Info Card --- */}
        <View style={[styles.profileInfoCardNew, { position: 'relative', zIndex: 20, overflow: 'visible' }]}> 
          <View style={[styles.profileInfoRowHorizontalNew, { position: 'relative', zIndex: 20, overflow: 'visible' }]}> 
            <View style={[styles.profileInfoColIconOnlyNew, { position: 'relative', zIndex: 20, overflow: 'visible' }]}> 
              <MaterialCommunityIcons name="school-outline" size={22} color="#1DA1F2" style={{marginRight: 8}} />
              {editing ? (
                <View style={{flex: 1, zIndex: 30, position: 'relative', overflow: 'visible'}}>
                  <UniversityAutocomplete
                    value={userData.school}
                    onChange={school => setUserData({ ...userData, school })}
                    inputStyle={[styles.profileInfoValueLarge, styles.editGlow]}
                    placeholder="School"
                  />
                </View>
              ) : (
                <Text style={styles.profileInfoValueLarge}>{userData.school || 'N/A'}</Text>
              )}
            </View>
            <View style={styles.profileInfoColIconOnlyNew}>
              <MaterialCommunityIcons name="book-outline" size={22} color="#F5C518" style={{marginRight: 8}} />
            {editing ? (
                <TextInput
                  style={[styles.profileInfoValueLarge, styles.editGlow]}
                  value={userData.major}
                  onChangeText={text => setUserData({...userData, major: text})}
                  placeholder="Major"
                  placeholderTextColor="#8E8E93"
                />
              ) : (
                <Text style={styles.profileInfoValueLarge}>{userData.major || 'N/A'}</Text>
              )}
            </View>
          </View>
          <View style={styles.profileInfoItemCentered}>
            <MaterialCommunityIcons name="balloon" size={22} color="#FF69B4" style={{marginRight: 10}} />
            {editing ? (
              <TextInput
                style={[styles.profileInfoValueLarge, styles.editGlow]}
                value={(() => {
                  let dateObj = null;
                  if (userData.birthDate && userData.birthDate.toDate) {
                    dateObj = userData.birthDate.toDate();
                  } else if (userData.birthDate) {
                    dateObj = new Date(userData.birthDate.seconds ? userData.birthDate.seconds * 1000 : userData.birthDate);
                  }
                  if (!dateObj) return '';
                  const month = dateObj.toLocaleString('default', { month: 'long' });
                  const day = dateObj.getDate();
                  return `${month} ${day}`;
                })()}
                onChangeText={() => {}}
                placeholder="Birthday"
                placeholderTextColor="#8E8E93"
                editable={false}
              />
            ) : (
              <Text style={styles.profileInfoValueLarge}>{(() => {
                let dateObj = null;
                if (userData.birthDate && userData.birthDate.toDate) {
                  dateObj = userData.birthDate.toDate();
                } else if (userData.birthDate) {
                  dateObj = new Date(userData.birthDate.seconds ? userData.birthDate.seconds * 1000 : userData.birthDate);
                }
                if (!dateObj) return 'N/A';
                const month = dateObj.toLocaleString('default', { month: 'long' });
                const day = dateObj.getDate();
                return `${month} ${day}`;
              })()}</Text>
            )}
          </View>
        </View>
        {/* --- Bio Section --- */}
        <View style={[styles.bioSection, { overflow: 'visible' }] }>
          {editing ? (
            <TextInput
              style={[styles.bioText, styles.editGlow]}
              value={userData.bio}
              onChangeText={text => setUserData({...userData, bio: text})}
              placeholder="Add a short bio about yourself."
              placeholderTextColor="#8E8E93"
              multiline
              textAlign="center"
            />
          ) : (
            <Text style={styles.bioText}>{userData.bio || 'Add a short bio about yourself.'}</Text>
          )}
        </View>
      </View>
      <View style={{borderTopWidth: 1, borderTopColor: '#2C2C2E', marginHorizontal: 16, marginBottom: 8}} />
      {/* --- Profile Tabs --- */}
      <ProfileTabs posts={userPosts} loading={loading} />
    </SafeAreaView>
  );
}

// --- PROFILE TABS COMPONENT ---
function ProfileTabs({ posts, loading }) {
  const [tab, setTab] = React.useState('Posts');
  const tabList = ['Posts', 'Media'];
  const filteredPosts = tab === 'Media' ? posts.filter(p => p.image) : posts;
  return (
    <View style={{flex: 1}}>
      <View style={styles.profileTabBar}>
        {tabList.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.profileTab, tab === t && styles.profileTabActive]}
            onPress={() => setTab(t)}>
            <Text style={[styles.profileTabText, tab === t && styles.profileTabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={{color:'#8E8E93', textAlign:'center', marginTop:32}}>{tab === 'Media' ? 'No media posts yet.' : 'No posts yet.'}</Text>}
        />
      )}
    </View>
  );
}

// ...existing code...

// --- AUTH SCREEN (Unchanged) ---
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
          school: school,
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
              <UniversityAutocomplete
                value={school}
                onChange={school => setSchool(school)}
                inputStyle={authStyles.input}
                placeholder="School"
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

// --- NEW POST SCREEN ---
function NewPostScreen({ navigation }) {
  const [postText, setPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // Placeholder handlers for toolbar actions
  const handleMedia = () => { /* TODO: Implement media picker */ };
  const handlePoll = () => { /* TODO: Implement poll creation */ };
  const handleLink = () => { /* TODO: Implement link attachment */ };
  const handleLocation = () => { /* TODO: Implement location tagging */ };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handlePost = async () => {
    if (!postText.trim()) return;
    setPosting(true);
    try {
      // Get current user info
      const user = auth.currentUser;
      let name = 'Anonymous';
      let handle = '@unknown';
      let location = '';
      let avatar = 'account-circle';
      if (user) {
        const userDoc = await getDoc(firestoreDoc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          name = userData.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : 'Anonymous';
          handle = userData.username ? `@${userData.username}` : '@unknown';
          location = userData.school || '';
          avatar = 'account-circle'; // You can customize this if you add avatar support
        }
      }
      await addDoc(collection(db, 'posts'), {
        text: postText,
        name,
        handle,
        location,
        avatar,
        createdAt: serverTimestamp(),
      });
      setPostText('');
      navigation.goBack();
    } catch (err) {
      alert('Failed to post.');
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.newPostHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.newPostCancel}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newPostButton} onPress={handlePost} disabled={posting}>
            <Text style={styles.newPostButtonText}>{posting ? 'Posting...' : 'Post'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.newPostInput}
          placeholder="What's happening?"
          placeholderTextColor="#8E8E93"
          value={postText}
          onChangeText={setPostText}
          multiline
          editable={!posting}
        />
        {/* --- Toolbar attached to keyboard --- */}
        {keyboardVisible && (
          <View style={styles.newPostToolbarKeyboard}>
            <TouchableOpacity onPress={handleMedia}>
              <MaterialCommunityIcons name="image-plus" size={28} color="#8E8E93" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePoll}>
              <MaterialCommunityIcons name="poll" size={28} color="#8E8E93" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLink}>
              <MaterialCommunityIcons name="link-variant" size={28} color="#8E8E93" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLocation}>
              <MaterialCommunityIcons name="map-marker-plus" size={28} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}


// --- MAIN APP SCREENS ---

// ...existing code...
const searchData = [ { id: 's1', text: 'Tuition Increase' }, { id: 's2', text: 'Milwaukee blows up' }, { id: 's3', text: 'Congress: "We give up"' }, { id: 's4', text: 'Cuomo announces bid for Minister of Israel' }, { id: 's5', text: 'TRUMP signs "Jim Crow Bill"' }, { id: 's6', text: 'Chicago to elect nobody as mayor' }, ];
const PostCard = ({ post }) => {
  const name = post.name || 'Anonymous';
  const handle = post.handle || '@unknown';
  const location = post.location || '';
  const avatar = post.avatar || 'account-circle';
  const text = post.text || '';
  return (
    <View style={styles.postCard}>
      <MaterialCommunityIcons name={avatar} size={50} color="#8E8E93" style={styles.avatar} />
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.handleText}>{handle}</Text>
          {location ? <Text style={styles.locationText}>· {location}</Text> : null}
        </View>
        <Text style={styles.bodyText}>{text}</Text>
        {post.image && (<Image source={{ uri: post.image }} style={styles.postImage} />)}
      </View>
    </View>
  );
};

function DiscoverScreen({ navigation, setTabBarVisible }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const lastOffsetY = useRef(0);
  const scrollThreshold = 100;

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postList = [];
      querySnapshot.forEach((doc) => {
        postList.push({ id: doc.id, ...doc.data() });
      });
      setPosts(postList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const direction = offsetY > lastOffsetY.current ? 'down' : 'up';
    lastOffsetY.current = offsetY;
    if (direction === 'down' && offsetY > scrollThreshold) {
      setTabBarVisible(false);
    } else if (direction === 'up' || offsetY <= 0) {
      setTabBarVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        {/* --- PROFILE BUTTON (top left) --- */}
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{marginRight: 12}}>
          <MaterialCommunityIcons name="account-circle" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        {/* --- NEW POST BUTTON (top right) --- */}
        <TouchableOpacity onPress={() => navigation.navigate('NewPost')}>
          <MaterialCommunityIcons name="feather" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => <PostCard post={item} />}
          keyExtractor={item => item.id}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}
function EventsScreen() { return ( <SafeAreaView style={styles.safeArea}> <View style={styles.container}><Text style={styles.text}>Events Screen</Text></View> </SafeAreaView> ); }
function MapScreen() { return ( <SafeAreaView style={styles.safeArea}> <View style={styles.container}><Text style={styles.text}>Map Screen</Text></View> </SafeAreaView> ); }
function SearchScreen() { return ( <SafeAreaView style={styles.safeArea}> <View style={styles.searchHeader}> <View style={styles.searchInputContainer}> <MaterialCommunityIcons name="magnify" size={22} color="#8E8E93" /> <TextInput placeholder="Search" placeholderTextColor="#8E8E93" style={styles.searchInput}/> </View> <MaterialCommunityIcons name="information-outline" size={26} color="#8E8E93" /> </View> <FlatList data={searchData} renderItem={({ item }) => ( <View style={styles.searchResultItem}><Text style={styles.searchResultText}>{item.text}</Text></View> )} keyExtractor={item => item.id}/> </SafeAreaView> ); }

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); // Create the native stack navigator instance

// --- TAB NAVIGATOR COMPONENT ---
function TabNavigator({ navigation }) { // It now receives navigation prop from the stack
  const [tabBarVisible, setTabBarVisible] = useState(true);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          display: tabBarVisible ? 'flex' : 'none',
          backgroundColor: '#000000',
          borderTopWidth: 0.5,
          borderTopColor: '#2F2F2F',
          paddingTop: 10,
        },
      }}>
      <Tab.Screen name="Discover" options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="compass" color={color} size={30} />)}}>
        {(props) => <DiscoverScreen {...props} navigation={navigation} setTabBarVisible={setTabBarVisible} />}
      </Tab.Screen>
      <Tab.Screen name="Events" component={EventsScreen} options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="calendar-star" color={color} size={30} />) }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="map-marker" color={color} size={30} />) }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="magnify" color={color} size={30} />) }} />
      {/* Profile tab removed; now accessed from header button */}
    </Tab.Navigator>
  );
}

// --- ROOT STACK NAVIGATOR ---
function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="NewPost" component={NewPostScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={DarkTheme}>
        {user ? <RootStack /> : <AuthScreen />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// --- Stylesheets ---
const AVATAR_SIZE = 120;
const styles = StyleSheet.create({
  editGlow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 14,
    backgroundColor: 'rgba(29,161,242,0.10)',
    borderRadius: 14,
    padding: 10,
  },
  avatarGlow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 18,
    borderRadius: AVATAR_SIZE / 2 + 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    padding: 12,
  },
  editPicOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioSection: {
    marginTop: 10,
    marginBottom: 18,
    paddingHorizontal: 12,
    width: '100%',
    alignItems: 'center',
  },
  bioText: {
    color: '#D1D1D6',
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    maxWidth: 340,
  },
  profileTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#232325',
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  profileTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  profileTabActive: {
    borderBottomColor: '#1DA1F2',
    backgroundColor: 'rgba(29,161,242,0.07)',
  },
  profileTabText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  profileTabTextActive: {
    color: '#1DA1F2',
    fontWeight: 'bold',
  },
  safeArea: { flex: 1, backgroundColor: '#000000', },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  text: { color: '#FFFFFF', fontSize: 20, },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', },
  listContent: { paddingBottom: 50, },
  postCard: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  avatar: { marginRight: 12, },
  postContent: { flex: 1, },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
  nameText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 4, },
  handleText: { color: '#8E8E93', marginRight: 4, },
  locationText: { color: '#8E8E93', },
  bodyText: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 12, },
  searchHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  searchInputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 10, paddingHorizontal: 10, marginRight: 10, },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: 16, paddingVertical: 8, },
  searchResultItem: { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  searchResultText: { color: '#FFFFFF', fontSize: 16, },
  // New Post Screen Styles
  newPostHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, },
  newPostCancel: { color: '#1DA1F2', fontSize: 16, },
  newPostButton: { backgroundColor: '#1DA1F2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, },
  newPostButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, },
  newPostInput: { color: '#FFFFFF', fontSize: 20, padding: 16, },
  newPostToolbarKeyboard: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#18181A',
    borderTopWidth: 1,
    borderTopColor: '#232325',
  },
  // Profile Info Card Styles
  profileInfoCard: {
    backgroundColor: '#18181A',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  profileInfoCardNew: {
    backgroundColor: '#18181A',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  profileInfoItemCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    width: '100%',
    gap: 10,
  },
  profileInfoRowHorizontalNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 18,
    marginBottom: 6,
  },
  profileInfoColIconOnlyNew: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 6,
    justifyContent: 'center',
  },
  profileInfoValueLarge: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    flexShrink: 1,
    fontWeight: '500',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileInfoRowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
    gap: 6,
  },
  profileInfoLabelCentered: {
    color: '#8E8E93',
    fontSize: 16,
    marginRight: 6,
    textAlign: 'center',
    minWidth: 70,
  },
  profileInfoValueCentered: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    flexShrink: 1,
  },
  profileInfoRowHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  profileInfoCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 2,
  },
  profileInfoColIconOnly: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 6,
  },
  profileInfoRowCenteredIconOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
    gap: 8,
  },
  profileInfoLabel: {
    color: '#8E8E93',
    fontSize: 16,
    minWidth: 70,
    marginRight: 6,
  },
  profileInfoValue: {
    color: '#fff',
    fontSize: 16,
    flexShrink: 1,
  },
});

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
