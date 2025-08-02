import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Image, TouchableOpacity, SafeAreaView } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { calculatePostScore } from '../utils/feedAlgorithm';
import { updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

// --- NEW PostActions Component for the feed ---
const PostActions = ({ post, navigation }) => {
    const currentUser = auth.currentUser;
    const [isLiked, setIsLiked] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(post.likeCount || 0);

    React.useEffect(() => {
        setIsLiked(currentUser && post.likes?.includes(currentUser.uid));
        setLikeCount(post.likeCount || 0);
    }, [post, currentUser]);

    const handleLike = async () => {
        if (!currentUser) return;
        const postRef = doc(db, 'posts', post.id);

        // Save previous state
        const prevLiked = isLiked;
        const prevCount = likeCount;

        // Optimistic update
        setIsLiked(!prevLiked);
        setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

        try {
            await updateDoc(postRef, {
                likes: prevLiked
                    ? arrayRemove(currentUser.uid)
                    : arrayUnion(currentUser.uid),
                likeCount: increment(prevLiked ? -1 : 1),
            });
        } catch (error) {
            // Revert on error
            setIsLiked(prevLiked);
            setLikeCount(prevCount);
            console.error("Error updating likes:", error);
        }
    };

    const navigateToComments = () => {
        navigation.navigate('PostDetail', { postId: post.id });
    };

    return (
        <View style={styles.actionBar}>
            <TouchableOpacity onPress={navigateToComments} style={styles.actionButton}>
                <MaterialCommunityIcons name="comment-outline" size={20} color="#8E8E93" />
                <Text style={styles.actionText}>{post.commentCount || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <MaterialCommunityIcons name={isLiked ? "heart" : "heart-outline"} size={20} color={isLiked ? "#E0245E" : "#8E8E93"} />
                <Text style={[styles.actionText, isLiked && { color: "#E0245E" }]}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="repeat-variant" size={20} color="#8E8E93" />
            </TouchableOpacity>
        </View>
    );
};


// --- Reusable PostCard Component ---
const PostCard = ({ post, navigation }) => {
  const name = post.name || 'Anonymous';
  const handle = post.handle || '@unknown';
  const location = post.location || '';
  const avatar = post.avatar || 'account-circle';
  const text = post.text || '';
  
  return (
    <TouchableOpacity onPress={() => navigation.navigate('PostDetail', { postId: post.id })} activeOpacity={0.8}>
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
                <PostActions post={post} navigation={navigation} />
            </View>
        </View>
    </TouchableOpacity>
  );
};


// --- DISCOVER SCREEN ---
export default function DiscoverScreen({ navigation, setTabBarVisible }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const lastOffsetY = useRef(0);
  const scrollThreshold = 100;

  // Fetch user profile data for scoring
  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        setCurrentUserProfile(null);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUserProfile({ uid: user.uid, ...userDoc.data() });
        } else {
          setCurrentUserProfile({ uid: user.uid });
        }
      } catch (e) {
        console.error('Failed to fetch user profile:', e);
        setCurrentUserProfile({ uid: user.uid });
      }
    };

    fetchUserProfile();
  }, []);

  // Subscribe to posts and score them
  useEffect(() => {
    const q = query(collection(db, 'posts')); // no orderBy, get raw data
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postList = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        postList.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp,
          event_time: data.event_time?.toMillis ? data.event_time.toMillis() : data.event_time,
        });
      });

      if (!currentUserProfile) {
        setPosts(postList);
        setLoading(false);
        return;
      }

      // Calculate score per post
      const scoredPosts = postList.map(post => ({
        ...post,
        score: calculatePostScore(post, currentUserProfile)
      }));

      // Sort by descending score
      scoredPosts.sort((a, b) => b.score - a.score);

      setPosts(scoredPosts);
      setLoading(false);
    }, (error) => {
      console.error("Firestore posts listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserProfile]);

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
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={{marginRight: 12}}>
          <MaterialCommunityIcons name="account-circle" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => navigation.navigate('NewPost')}>
          <MaterialCommunityIcons name="feather" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostCard 
              post={item} 
              navigation={navigation}
            />
          )}
          keyExtractor={item => item.id}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000', },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', },
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
      justifyContent: 'flex-start',
      marginTop: 12,
      paddingBottom: 12,
  },
  actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 27,
  },
  actionText: {
      color: '#8E8E93',
      marginLeft: 6,
      fontSize: 14,
  },
});
