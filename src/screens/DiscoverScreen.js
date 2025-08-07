import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, TouchableOpacity, SafeAreaView, RefreshControl, Platform, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { usePosts, useUser, useUserCache } from '../context/DataContext';
import { calculatePostScore, getAlgorithmMetrics } from '../utils/feedAlgorithm';
import { storeAlgorithmMetrics } from '../services/analyticsService';
import PostCard from '../components/PostCard';
import PostActions from '../components/PostActions';
import PerformanceMonitor from '../components/PerformanceMonitor';

export default function DiscoverScreen({ navigation, setTabBarVisible }) {
  // Use centralized data context
  const { posts, loading, error } = usePosts();
  const { userProfile } = useUser();
  const { userCache, schoolCache, avatarCache } = useUserCache();
  
  // Local state for UI
  const [refreshing, setRefreshing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [sortOption, setSortOption] = useState('relevant');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const lastOffsetY = useRef(0);
  const scrollThreshold = 100;

  // Memoized sorted and filtered posts for better performance
  const processedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    
    let scoredPosts = posts.map(post => ({
      ...post,
      score: userProfile ? calculatePostScore(post, userProfile) : 0
    }));
    
    // Filter by school if "myschool" option is selected
    if (sortOption === 'myschool' && userProfile?.university) {
      scoredPosts = scoredPosts.filter(post => 
        post.school === userProfile.university || 
        schoolCache[post.userId] === userProfile.university
      );
    }
    
    // Sort based on selected option
    switch (sortOption) {
      case 'relevant':
      case 'myschool':
        scoredPosts.sort((a, b) => b.score - a.score);
        break;
      case 'recent':
        scoredPosts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        break;
      case 'liked':
        scoredPosts.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        break;
      case 'commented':
        scoredPosts.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
      case 'oldest':
        scoredPosts.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        break;
      default:
        scoredPosts.sort((a, b) => b.score - a.score);
    }
    
    return scoredPosts;
  }, [posts, userProfile, sortOption, schoolCache]);

  // Store algorithm metrics periodically
  useEffect(() => {
    if (userProfile?.uid && processedPosts.length > 0 && Math.random() < 0.1) {
      const metrics = getAlgorithmMetrics(processedPosts);
      storeAlgorithmMetrics(processedPosts, metrics, userProfile.uid).catch(error => {
        console.error('[DiscoverScreen] Failed to store algorithm metrics:', error);
      });
    }
  }, [processedPosts, userProfile?.uid]);

  // Optimized scroll handler with debouncing
  const handleScroll = useCallback((event) => {
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
  }, [dropdownVisible, setTabBarVisible]);

  // Optimized refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // The centralized data context will handle the refresh
    // We just need to reset the refreshing state after a short delay
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Optimized dropdown toggle
  const toggleDropdown = useCallback(() => {
    if (dropdownVisible) {
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setDropdownVisible(false);
      });
    } else {
      setDropdownVisible(true);
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [dropdownVisible, dropdownAnimation]);

  // Optimized sort option selection
  const selectSortOption = useCallback((option) => {
    setSortOption(option);
    toggleDropdown();
  }, [toggleDropdown]);

  // Listen for post creation events
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('postCreated', () => {
      setBannerText('Post created');
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 1800);
    });
    return () => sub.remove();
  }, []);

  // Memoized render item for better performance
  const renderPostItem = useCallback(({ item }) => {
    let updatedPhotoURL = avatarCache[item.userId] || '';
    let userSchool = schoolCache[item.userId] || '';
    
    if (userProfile && item.userId === userProfile.uid) {
      if (userProfile.photoURL) updatedPhotoURL = userProfile.photoURL;
      if (userProfile.university) userSchool = userProfile.university;
    }
    
    const postProps = {
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
  }, [avatarCache, schoolCache, userProfile, navigation]);

  // Memoized key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>Failed to load posts</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Discover</Text>
          <TouchableOpacity onPress={toggleDropdown} style={styles.sortButton}>
            <MaterialCommunityIcons name="sort-variant" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Sort Dropdown */}
        {dropdownVisible && (
          <Animated.View 
            style={[
              styles.dropdown,
              {
                opacity: dropdownAnimation,
                transform: [{
                  translateY: dropdownAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                }],
              },
            ]}
          >
            <BlurView intensity={80} tint="dark" style={styles.dropdownBlur}>
              {[
                { key: 'relevant', label: 'Most Relevant', icon: 'star' },
                { key: 'recent', label: 'Most Recent', icon: 'clock' },
                { key: 'liked', label: 'Most Liked', icon: 'heart' },
                { key: 'commented', label: 'Most Commented', icon: 'comment' },
                { key: 'myschool', label: 'My School', icon: 'school' },
                { key: 'oldest', label: 'Oldest First', icon: 'sort-calendar-ascending' },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.dropdownItem,
                    sortOption === option.key && styles.dropdownItemActive
                  ]}
                  onPress={() => selectSortOption(option.key)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={20} 
                    color={sortOption === option.key ? '#1DA1F2' : '#fff'} 
                  />
                  <Text style={[
                    styles.dropdownItemText,
                    sortOption === option.key && styles.dropdownItemTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </BlurView>
          </Animated.View>
        )}
      </View>

      {/* Success Banner */}
      {showBanner && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{bannerText}</Text>
        </View>
      )}

      {/* Posts List */}
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={processedPosts}
          renderItem={renderPostItem}
          keyExtractor={keyExtractor}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#fff']}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
                     getItemLayout={(data, index) => ({
             length: 200, // Approximate height of each post
             offset: 200 * index,
             index,
           })}
         />
       )}
       
       {/* Performance Monitor (only visible in development) */}
       <PerformanceMonitor visible={__DEV__} />
     </SafeAreaView>
   );
 }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'relative',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  sortButton: {
    padding: 8,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 20,
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 1000,
  },
  dropdownBlur: {
    padding: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(29, 161, 242, 0.2)',
  },
  dropdownItemText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  dropdownItemTextActive: {
    color: '#1DA1F2',
    fontWeight: '600',
  },
  banner: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});