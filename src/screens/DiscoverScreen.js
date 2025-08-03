import React, { useState, useEffect, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, TouchableOpacity, SafeAreaView, RefreshControl, Platform, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { calculatePostScore, getAlgorithmMetrics } from '../utils/feedAlgorithm';
import { storeAlgorithmMetrics } from '../services/analyticsService';
import PostCard from '../components/PostCard';
import PostActions from '../components/PostActions';

export default function DiscoverScreen({ navigation, setTabBarVisible }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [userAvatar, setUserAvatar] = useState(null);
  const [avatarCache, setAvatarCache] = useState({});
  const [schoolCache, setSchoolCache] = useState({});
  const [showBanner, setShowBanner] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [sortOption, setSortOption] = useState('relevant');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const lastOffsetY = useRef(0);
  const scrollThreshold = 100;

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setCurrentUserProfile(null);
        setUserAvatar(null);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setCurrentUserProfile({ uid: user.uid, ...data });
          setUserAvatar(data.photoURL || null);
        } else {
          setCurrentUserProfile({ uid: user.uid });
          setUserAvatar(null);
        }
      } catch (e) {
        setCurrentUserProfile({ uid: user.uid });
        setUserAvatar(null);
      }
    };
    fetchUserProfile();
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserAvatar(data.photoURL || null);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'posts'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const postList = [];
      const userIds = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        postList.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp,
          event_time: data.event_time?.toMillis ? data.event_time.toMillis() : data.event_time,
        });
        if (data.userId) userIds.add(data.userId);
      });
      const avatarMap = { ...avatarCache };
      const schoolMap = { ...schoolCache };
      const missingUserIds = Array.from(userIds).filter(uid => !avatarMap[uid]);
      if (missingUserIds.length > 0) {
        await Promise.all(missingUserIds.map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              avatarMap[uid] = data.photoURL || '';
              schoolMap[uid] = data.university || data.school || '';
            } else {
              avatarMap[uid] = '';
              schoolMap[uid] = '';
            }
          } catch {
            avatarMap[uid] = '';
            schoolMap[uid] = '';
          }
        }));
        setAvatarCache(avatarMap);
        setSchoolCache(schoolMap);
      }
      if (!currentUserProfile) {
        setPosts(postList);
        setLoading(false);
        return;
      }
      let scoredPosts = postList.map(post => ({
        ...post,
        score: calculatePostScore(post, currentUserProfile)
      }));
      
      // Filter by school if "myschool" option is selected
      if (sortOption === 'myschool' && currentUserProfile?.university) {
        scoredPosts = scoredPosts.filter(post => 
          post.school === currentUserProfile.university || 
          schoolCache[post.userId] === currentUserProfile.university
        );
      }
      
      if (sortOption === 'relevant' || sortOption === 'myschool') {
        // Sort by algorithm score (most relevant first)
        scoredPosts.sort((a, b) => b.score - a.score);
      } else if (sortOption === 'recent') {
        scoredPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      } else if (sortOption === 'liked') {
        scoredPosts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      } else if (sortOption === 'commented') {
        scoredPosts.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
      } else if (sortOption === 'oldest') {
        scoredPosts.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      } else {
        // Default fallback to relevant
        scoredPosts.sort((a, b) => b.score - a.score);
      }
      setPosts(scoredPosts);
      setLoading(false);
      setRefreshing(false); // Stop refreshing when data loads
      
      // Store algorithm performance metrics (periodically)
      if (currentUserProfile?.uid && scoredPosts.length > 0 && Math.random() < 0.1) {
        // Store metrics for 10% of feed loads to avoid excessive writes
        const metrics = getAlgorithmMetrics(scoredPosts);
        storeAlgorithmMetrics(scoredPosts, metrics, currentUserProfile.uid).catch(error => {
          console.error('[DiscoverScreen] Failed to store algorithm metrics:', error);
        });
      }
    }, (error) => {
      setLoading(false);
      setRefreshing(false); // Stop refreshing on error
    });
    return () => unsubscribe();
  }, [currentUserProfile, sortOption, avatarCache, schoolCache]);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const direction = offsetY > lastOffsetY.current ? 'down' : 'up';
    lastOffsetY.current = offsetY;
    
    // Close dropdown when scrolling
    if (dropdownVisible) {
      toggleDropdown();
    }
    
    if (direction === 'down' && offsetY > scrollThreshold) {
      setTabBarVisible(false);
    } else if (direction === 'up' || offsetY <= 0) {
      setTabBarVisible(true);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // The Firebase listener will automatically fetch fresh data
    // and setRefreshing(false) will be called when data loads
  }, []);

  const toggleDropdown = () => {
    if (dropdownVisible) {
      // Hide dropdown
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setDropdownVisible(false);
      });
    } else {
      // Show dropdown
      setDropdownVisible(true);
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const selectSortOption = (option) => {
    setSortOption(option);
    toggleDropdown();
  };

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('postCreated', () => {
      setBannerText('Post created');
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 1800);
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Dropdown Overlay */}
      {dropdownVisible && (
        <TouchableOpacity 
          style={styles.dropdownOverlay} 
          activeOpacity={1}
          onPress={toggleDropdown}
        />
      )}
      
      {showBanner && (
        <View style={styles.bannerBottomCentered}>
          <Text style={styles.bannerTextSubtle}>{bannerText}</Text>
        </View>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{marginRight: 12}}>
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
          <TouchableOpacity onPress={toggleDropdown} style={styles.sortIconButton}>
            <MaterialCommunityIcons 
              name="filter-variant" 
              size={24} 
              color={dropdownVisible ? "#1DA1F2" : "#FFFFFF"} 
            />
            <MaterialCommunityIcons 
              name={dropdownVisible ? "chevron-up" : "chevron-down"} 
              size={16} 
              color={dropdownVisible ? "#1DA1F2" : "#FFFFFF"} 
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
          
          {/* Dropdown Menu */}
          {dropdownVisible && (
            <Animated.View 
              style={[
                styles.dropdown,
                {
                  opacity: dropdownAnimation,
                  transform: [{
                    translateY: dropdownAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    })
                  }]
                }
              ]}
            >
              <BlurView intensity={80} tint="dark" style={styles.dropdownBlur}>
                <TouchableOpacity 
                  style={[styles.dropdownItem, sortOption === 'relevant' && styles.dropdownItemActive]}
                  onPress={() => selectSortOption('relevant')}
                >
                  <MaterialCommunityIcons name="star" size={16} color="#1DA1F2" style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, sortOption === 'relevant' && styles.dropdownTextActive]}>
                    Most Relevant
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dropdownItem, sortOption === 'recent' && styles.dropdownItemActive]}
                  onPress={() => selectSortOption('recent')}
                >
                  <MaterialCommunityIcons name="clock-outline" size={16} color="#8E8E93" style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, sortOption === 'recent' && styles.dropdownTextActive]}>
                    Most Recent
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dropdownItem, sortOption === 'liked' && styles.dropdownItemActive]}
                  onPress={() => selectSortOption('liked')}
                >
                  <MaterialCommunityIcons name="heart-outline" size={16} color="#8E8E93" style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, sortOption === 'liked' && styles.dropdownTextActive]}>
                    Most Liked
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dropdownItem, sortOption === 'commented' && styles.dropdownItemActive]}
                  onPress={() => selectSortOption('commented')}
                >
                  <MaterialCommunityIcons name="comment-outline" size={16} color="#8E8E93" style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, sortOption === 'commented' && styles.dropdownTextActive]}>
                    Most Commented
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.dropdownItem, styles.dropdownItemLast, sortOption === 'oldest' && styles.dropdownItemActive]}
                  onPress={() => selectSortOption('oldest')}
                >
                  <MaterialCommunityIcons name="history" size={16} color="#8E8E93" style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, sortOption === 'oldest' && styles.dropdownTextActive]}>
                    Oldest
                  </Text>
                </TouchableOpacity>
                
                {/* School Filter Separator */}
                <View style={styles.dropdownSeparator} />
                
                <TouchableOpacity 
                  style={[styles.dropdownItem, styles.dropdownItemLast, sortOption === 'myschool' && styles.dropdownItemActive]}
                  onPress={() => selectSortOption('myschool')}
                >
                  <MaterialCommunityIcons name="school" size={16} color="#1DA1F2" style={styles.dropdownIcon} />
                  <Text style={[styles.dropdownText, sortOption === 'myschool' && styles.dropdownTextActive]}>
                    My School Only
                  </Text>
                </TouchableOpacity>
              </BlurView>
            </Animated.View>
          )}
        </View>
      </View>
        {loading ? (
          <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={posts}
            renderItem={({ item }) => {
              let updatedPhotoURL = avatarCache[item.userId] || '';
              let userSchool = schoolCache[item.userId] || '';
              if (currentUserProfile && item.userId === currentUserProfile.uid && currentUserProfile.photoURL) {
                updatedPhotoURL = currentUserProfile.photoURL;
              }
              if (currentUserProfile && item.userId === currentUserProfile.uid && currentUserProfile.university) {
                userSchool = currentUserProfile.university;
              }
              let postProps = {
                ...item,
                likes: Array.isArray(item.likes) ? item.likes : [],
                likeCount: typeof item.likeCount === 'number' ? item.likeCount : 0,
                commentCount: typeof item.commentCount === 'number' ? item.commentCount : 0,
                name: item.name || 'Anonymous',
                handle: item.handle || '@unknown',
                avatar: item.avatar || 'account-circle',
                photoURL: updatedPhotoURL,
                school: userSchool
              };
              if (item.isRepost) {
                postProps.text = '';
                postProps.image = null;
              } else {
                postProps.text = item.text || '';
                postProps.image = item.image || null;
              }
              return (
                <PostCard 
                  post={postProps}
                  navigation={navigation}
                  renderToolbar={() => <PostActions post={item} navigation={navigation} />}
                />
              );
            }}
            keyExtractor={item => item.id}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
                titleColor="#FFFFFF"
                colors={['#1DA1F2']}
                progressBackgroundColor="#2C2C2E"
              />
            }
          />
        )}
        <View 
          style={styles.floatingActionButton}
        >
          <BlurView
            intensity={80}
            tint="dark"
            style={styles.floatingActionButtonBlur}
          >
            <TouchableOpacity 
              onPress={() => navigation.navigate('NewPost')}
              style={styles.floatingActionButtonInner}
            >
              <MaterialCommunityIcons name="feather" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </BlurView>
        </View>
      </SafeAreaView>
  );

}
const styles = StyleSheet.create({
  floatingActionButton: {
    position: 'absolute',
    bottom: 16, // Much lower, standard FAB position
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingActionButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingActionButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortIconButton: {
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    width: 180,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
  },
  dropdownBlur: {
    flex: 1,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(29, 161, 242, 0.15)',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  dropdownIcon: {
    marginRight: 12,
    width: 16,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownTextActive: {
    color: '#1DA1F2',
    fontWeight: '600',
  },
  logo: {
    width: 72,
    height: 72,
  },
  safeArea: { flex: 1, backgroundColor: '#000000', },
  bannerBottomCentered: {
    position: 'absolute',
    left: '50%',
    bottom: 32,
    transform: [{ translateX: -0.5 * 0.7 * 400 }],
    zIndex: 10,
    backgroundColor: 'rgba(29,161,242,0.85)',
    paddingVertical: 4,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    width: 0.7 * 400,
    minWidth: 180,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  bannerTextSubtle: {
    color: '#eaf6fd',
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', },
  authStatus: { color: '#8E8E93', fontSize: 13, marginRight: 2, },
  listContent: { paddingBottom: 50, },
  postCard: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  avatar: { marginRight: 12 },
  postContent: { flex: 1, },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
  nameText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 4, },
  handleText: { color: '#8E8E93', },
  locationText: { color: '#8E8E93', },
  bodyText: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 12, },
  actionBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingBottom: 12,
      marginRight: 27,
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  actionText: {
    color: '#8E8E93',
    marginLeft: 6,
    fontSize: 14
  }
});