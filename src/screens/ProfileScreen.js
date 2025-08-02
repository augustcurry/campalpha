import React, { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { uploadString } from 'firebase/storage';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, TouchableOpacity, SafeAreaView, TextInput } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { collection, query, orderBy, onSnapshot, getDoc, doc as firestoreDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { signOut } from 'firebase/auth';
import Autocomplete from 'react-native-autocomplete-input';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PostCard from '../components/PostCard';

const storage = getStorage();


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


// --- PROFILE TABS COMPONENT ---
function ProfileTabs({ posts, loading, navigation }) {
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
          renderItem={({ item }) => <PostCard post={item} navigation={navigation} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={{color:'#8E8E93', textAlign:'center', marginTop:32}}>{tab === 'Media' ? 'No media posts yet.' : 'No posts yet.'}</Text>}
        />
      )}
    </View>
  );
}


// --- PROFILE SCREEN ---
function ProfileScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    } catch (e) {
      alert('Failed to log out.');
    }
  };
  const [userData, setUserData] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // pickImageAndUpload refactored to use Blob upload with fetch
  const pickImageAndUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access media library is required!");
        return;
      }

      let pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (pickerResult.cancelled) return;

      if (!pickerResult.assets || pickerResult.assets.length === 0) {
        alert("Failed to get image URI.");
        return;
      }

      setUploading(true);

      const fileUri = pickerResult.assets[0].uri;

      // Convert local file URI to Blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const user = auth.currentUser;
      if (!user) {
        alert("No authenticated user.");
        setUploading(false);
        return;
      }

      const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      await setDoc(
        firestoreDoc(db, 'users', user.uid),
        { photoURL: downloadURL },
        { merge: true }
      );

      setUserData(prev => ({ ...prev, photoURL: downloadURL }));

      alert("Profile picture updated!");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userDocRef = firestoreDoc(db, 'users', user.uid);
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));

    const unsubUser = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    const unsubPosts = onSnapshot(postsQuery, (querySnapshot) => {
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

    return () => {
      unsubUser();
      unsubPosts();
    };
  }, [userData?.username]); // Rerun if username changes

  if (!userData) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#fff" /></View>;
  }

  const handleEditToggle = async () => {
    if (editing) {
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
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingTop: 8, paddingHorizontal: 16, overflow: 'visible'}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{padding: 4}}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#1DA1F2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEditToggle}>
          <MaterialCommunityIcons name={editing ? 'check' : 'pencil'} size={28} color="#1DA1F2" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={{marginLeft: 12, padding: 4}}>
          <MaterialCommunityIcons name="logout" size={28} color="#E0245E" />
        </TouchableOpacity>
      </View>
      <View style={{alignItems: 'center', padding: 24, paddingTop: 8, overflow: 'visible'}}>
        <View style={editing ? styles.avatarGlow : null}>
          <TouchableOpacity
            disabled={!editing || uploading}
            onPress={pickImageAndUpload}
            activeOpacity={editing && !uploading ? 0.7 : 1}
            style={{ position: 'relative' }}
          >
            {userData.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={{ width: 120, height: 120, borderRadius: 60 }}
              />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={120} color="#8E8E93" />
            )}
            {uploading && (
              <View
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 60,
                }}
              >
                <ActivityIndicator size="large" color="#1DA1F2" />
              </View>
            )}
            {!uploading && editing && (
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
      <ProfileTabs posts={userPosts} loading={loading} navigation={navigation} />
    </SafeAreaView>
  );
}

const AVATAR_SIZE = 120;
const styles = StyleSheet.create({
  editGlow: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.45, shadowRadius: 18, elevation: 14, backgroundColor: 'rgba(29,161,242,0.10)', borderRadius: 14, padding: 10, },
  avatarGlow: { shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.35, shadowRadius: 32, elevation: 18, borderRadius: AVATAR_SIZE / 2 + 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8, padding: 12, },
  editPicOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, padding: 4, alignItems: 'center', justifyContent: 'center', },
  bioSection: { marginTop: 10, marginBottom: 18, paddingHorizontal: 12, width: '100%', alignItems: 'center', },
  bioText: { color: '#D1D1D6', fontSize: 15, textAlign: 'center', fontStyle: 'italic', lineHeight: 20, maxWidth: 340, },
  profileTabBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#232325', backgroundColor: 'transparent', minHeight: 44, },
  profileTab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', },
  profileTabActive: { borderBottomColor: '#1DA1F2', backgroundColor: 'rgba(29,161,242,0.07)', },
  profileTabText: { color: '#8E8E93', fontSize: 16, fontWeight: '500', },
  profileTabTextActive: { color: '#1DA1F2', fontWeight: 'bold', },
  safeArea: { flex: 1, backgroundColor: '#000000', },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  postCard: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  avatar: { marginRight: 12, },
  postContent: { flex: 1, },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
  nameText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 4, },
  handleText: { color: '#8E8E93', marginRight: 4, },
  locationText: { color: '#8E8E93', },
  bodyText: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 12, },
  profileInfoCardNew: { backgroundColor: '#18181A', borderRadius: 14, paddingVertical: 18, paddingHorizontal: 20, marginTop: 8, marginBottom: 8, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2, gap: 12, },
  profileInfoItemCentered: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 0, width: '100%', gap: 10, },
  profileInfoRowHorizontalNew: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 18, marginBottom: 6, },
  profileInfoColIconOnlyNew: { flex: 1, flexDirection: 'row', alignItems: 'center', minWidth: 0, gap: 6, justifyContent: 'center', },
  profileInfoValueLarge: { color: '#fff', fontSize: 18, textAlign: 'center', flexShrink: 1, fontWeight: '500', },
  listContent: { paddingBottom: 50, },
});


export default ProfileScreen;