import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  Animated
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import PostCard from '../components/PostCard';
import { searchLocalUniversities } from '../data/universities';
import { getTimeAgo } from '../utils/timeUtils';

function SearchScreen({ navigation, setTabBarVisible }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Ensure tab bar is visible on this screen
  useEffect(() => {
    if (setTabBarVisible) {
      setTabBarVisible(true);
    }
  }, [setTabBarVisible]);

  // Load trending topics and recent searches on mount
  useEffect(() => {
    loadTrendingTopics();
    loadRecentSearches();
  }, []);

  const loadTrendingTopics = async () => {
    try {
      // Get recent posts to extract trending topics
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      const topicCounts = {};
      postsSnapshot.forEach(doc => {
        const post = doc.data();
        if (post.text) {
          // Extract hashtags and keywords
          const hashtags = post.text.match(/#\w+/g) || [];
          const words = post.text.toLowerCase().split(/\s+/).filter(word => 
            word.length > 3 && !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
          );
          
          [...hashtags, ...words].forEach(topic => {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
          });
        }
      });

      const trending = Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));

      setTrendingTopics(trending);
    } catch (error) {
      console.error('Error loading trending topics:', error);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setRecentSearches(userData.recentSearches || []);
        }
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query) => {
    try {
      const user = auth.currentUser;
      if (user && query.trim()) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const searches = userData.recentSearches || [];
          const newSearches = [query.trim(), ...searches.filter(s => s !== query.trim())].slice(0, 10);
          await userRef.update({ recentSearches: newSearches });
          setRecentSearches(newSearches);
        }
      }
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setUsers([]);
      setPosts([]);
      return;
    }

    setLoading(true);
    try {
      const searchTerm = query.toLowerCase().trim();
      
      // Search for users
      const usersQuery = query(
        collection(db, 'users'),
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = [];
      usersSnapshot.forEach(doc => {
        usersList.push({ id: doc.id, ...doc.data() });
      });

      // Also search by handle
      const handleQuery = query(
        collection(db, 'users'),
        where('handle', '>=', searchTerm),
        where('handle', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      const handleSnapshot = await getDocs(handleQuery);
      handleSnapshot.forEach(doc => {
        const userData = { id: doc.id, ...doc.data() };
        if (!usersList.find(u => u.id === userData.id)) {
          usersList.push(userData);
        }
      });

      // Search for posts
      const postsQuery = query(
        collection(db, 'posts'),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const postsList = [];
      postsSnapshot.forEach(doc => {
        const post = doc.data();
        if (post.text && post.text.toLowerCase().includes(searchTerm)) {
          postsList.push({ id: doc.id, ...post });
        }
      });

      // Search for universities
      const universities = searchLocalUniversities(searchTerm, 5);

      setUsers(usersList);
      setPosts(postsList);
      setSearchResults([...usersList, ...postsList, ...universities.map(u => ({ ...u, type: 'university' }))]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout for search
    searchTimeout.current = setTimeout(() => {
      performSearch(text);
      if (text.trim()) {
        saveRecentSearch(text);
      }
    }, 500);
  };

  const handleTopicPress = (topic) => {
    setSearchQuery(topic);
    performSearch(topic);
    saveRecentSearch(topic);
  };

  const handleUserPress = (user) => {
    navigation.navigate('Profile', { userId: user.id });
  };

  const handleUniversityPress = (university) => {
    // Navigate to a filtered feed for this university
    navigation.navigate('Discover', { school: university.name });
  };

  const renderTrendingItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.trendingItem} 
      onPress={() => handleTopicPress(item.topic)}
    >
      <View style={styles.trendingContent}>
        <Text style={styles.trendingTopic}>#{item.topic}</Text>
        <Text style={styles.trendingCount}>{item.count} posts</Text>
      </View>
      <MaterialCommunityIcons name="trending-up" size={20} color="#1DA1F2" />
    </TouchableOpacity>
  );

  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity 
      style={styles.recentSearchItem} 
      onPress={() => handleTopicPress(item)}
    >
      <MaterialCommunityIcons name="history" size={20} color="#8E8E93" />
      <Text style={styles.recentSearchText}>{item}</Text>
      <TouchableOpacity onPress={() => {
        const newSearches = recentSearches.filter(s => s !== item);
        setRecentSearches(newSearches);
        // Update in Firebase
        const user = auth.currentUser;
        if (user) {
          doc(db, 'users', user.uid).update({ recentSearches: newSearches });
        }
      }}>
        <MaterialCommunityIcons name="close" size={16} color="#8E8E93" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }) => {
    if (item.type === 'university') {
      return (
        <TouchableOpacity 
          style={styles.universityItem} 
          onPress={() => handleUniversityPress(item)}
        >
          <MaterialCommunityIcons name="school" size={24} color="#1DA1F2" />
          <View style={styles.universityInfo}>
            <Text style={styles.universityName}>{item.name}</Text>
            <Text style={styles.universityLocation}>{item.state}, {item.country}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
        </TouchableOpacity>
      );
    }

    if (item.name || item.handle) {
      // This is a user
      return (
        <TouchableOpacity 
          style={styles.userItem} 
          onPress={() => handleUserPress(item)}
        >
          {item.photoURL ? (
            <Image source={{ uri: item.photoURL }} style={styles.userAvatar} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={40} color="#8E8E93" />
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name || 'Anonymous'}</Text>
            <Text style={styles.userHandle}>{item.handle || '@unknown'}</Text>
            {item.university && (
              <View style={styles.schoolBadge}>
                <MaterialCommunityIcons name="school" size={12} color="#1DA1F2" />
                <Text style={styles.schoolText}>{item.university}</Text>
              </View>
            )}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#8E8E93" />
        </TouchableOpacity>
      );
    }

    // This is a post
    return <PostCard post={item} navigation={navigation} />;
  };

  const renderTabContent = () => {
    if (searchQuery.trim()) {
      return (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item, index) => item.id || `${item.type}-${index}`}
          contentContainerStyle={styles.searchResultsContainer}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="magnify" size={48} color="#8E8E93" />
                <Text style={styles.emptyStateText}>No results found for "{searchQuery}"</Text>
              </View>
            ) : null
          }
        />
      );
    }

    if (activeTab === 'trending') {
      return (
        <FlatList
          data={trendingTopics}
          renderItem={renderTrendingItem}
          keyExtractor={(item) => item.topic}
          contentContainerStyle={styles.trendingContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadTrendingTopics().finally(() => setRefreshing(false));
              }}
              tintColor="#FFFFFF"
            />
          }
        />
      );
    }

    return (
      <FlatList
        data={recentSearches}
        renderItem={renderRecentSearch}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.recentSearchesContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={48} color="#8E8E93" />
            <Text style={styles.emptyStateText}>No recent searches</Text>
          </View>
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={22} color="#8E8E93" />
          <TextInput 
            placeholder="Search posts, people, or schools..." 
            placeholderTextColor="#8E8E93" 
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setSearchResults([]);
            }}>
              <MaterialCommunityIcons name="close" size={20} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <MaterialCommunityIcons name="bell-outline" size={26} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {!searchQuery.trim() && (
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'trending' && styles.activeTab]} 
            onPress={() => setActiveTab('trending')}
          >
            <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
              Trending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'recent' && styles.activeTab]} 
            onPress={() => setActiveTab('recent')}
          >
            <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
              Recent
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
        </View>
      )}

      {renderTabContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#000000' 
  },
  searchHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#2C2C2E' 
  },
  searchInputContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#2C2C2E', 
    borderRadius: 10, 
    paddingHorizontal: 12, 
    marginRight: 12 
  },
  searchInput: { 
    flex: 1, 
    color: '#FFFFFF', 
    fontSize: 16, 
    paddingVertical: 12,
    marginLeft: 8
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1DA1F2',
  },
  tabText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1DA1F2',
  },
  trendingContainer: {
    padding: 16,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  trendingContent: {
    flex: 1,
  },
  trendingTopic: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingCount: {
    color: '#8E8E93',
    fontSize: 14,
  },
  recentSearchesContainer: {
    padding: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  recentSearchText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  searchResultsContainer: {
    paddingBottom: 100,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userHandle: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  schoolText: {
    color: '#1DA1F2',
    fontSize: 12,
    marginLeft: 4,
  },
  universityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  universityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  universityName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  universityLocation: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default SearchScreen;