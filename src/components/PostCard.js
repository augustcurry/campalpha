import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getTimeAgo } from '../utils/timeUtils';
import { storeFeedInteraction } from '../services/analyticsService';
import { auth } from '../../firebase';

const PostCard = ({ post, navigation, renderToolbar }) => {
  const name = post.name || 'Anonymous';
  const handle = post.handle || '@unknown';
  const location = post.location || '';
  // If avatar is a URL, use it as photoURL. Otherwise, use photoURL or fallback to icon.
  let photoURL = post.photoURL || null;
  let avatar = post.avatar || 'account-circle';
  // If avatar is a URL, treat it as the photoURL
  if (avatar && typeof avatar === 'string' && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
    photoURL = avatar;
    avatar = 'account-circle';
  }
  const text = post.text || '';

  // Track post view when component mounts
  React.useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser && post.id) {
      // Track post view (async, non-blocking)
      storeFeedInteraction(currentUser.uid, 'view', post.id, {
        postType: post.isRepost ? 'repost' : 'original',
        hasImage: !!post.image,
        hasText: !!post.text,
        school: post.school || null
      }).catch(error => {
        // Silently fail to avoid disrupting user experience
        console.warn('[PostCard] Failed to track view:', error);
      });
    }
  }, [post.id]);

  // Nested preview for reposts
  const [originalPost, setOriginalPost] = React.useState(null);
  React.useEffect(() => {
    let unsub = null;
    if (post.isRepost && post.originalPostId) {
      const { doc, onSnapshot } = require('firebase/firestore');
      const { db } = require('../../firebase');
      const postRef = doc(db, 'posts', post.originalPostId);
      unsub = onSnapshot(postRef, (docSnap) => {
        if (docSnap.exists()) {
          setOriginalPost({ id: docSnap.id, ...docSnap.data() });
        } else {
          setOriginalPost(null);
        }
      });
    }
    return () => { if (unsub) unsub(); };
  }, [post.isRepost, post.originalPostId]);

  // If this is a repost, clicking the card should go to the original post
  const handlePress = () => {
    const currentUser = auth.currentUser;
    const targetPostId = post.isRepost && post.originalPostId ? post.originalPostId : post.id;
    
    // Track click interaction
    if (currentUser) {
      storeFeedInteraction(currentUser.uid, 'click', targetPostId, {
        fromRepost: post.isRepost,
        clickType: 'post_detail',
        school: post.school || null
      }).catch(error => {
        console.warn('[PostCard] Failed to track click:', error);
      });
    }
    
    if (post.isRepost && post.originalPostId) {
      navigation.navigate('PostDetail', { postId: post.originalPostId });
    } else {
      navigation.navigate('PostDetail', { postId: post.id });
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.postCard}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }} />
        ) : (
          <MaterialCommunityIcons name={avatar} size={50} color="#8E8E93" style={styles.avatar} />
        )}
        <View style={styles.postContent}>
          <View style={styles.postHeader}>
            <Text style={styles.nameText}>{name}</Text>
            <Text style={styles.handleText}>{handle}</Text>
            {post.school && (
              <View style={styles.schoolBadge}>
                <MaterialCommunityIcons name="school" size={12} color="#1DA1F2" />
                <Text style={styles.schoolText}>{post.school}</Text>
              </View>
            )}
            {location ? <Text style={styles.locationText}>· {location}</Text> : null}
            <Text style={styles.timeText}>· {getTimeAgo(post.timestamp)}</Text>
          </View>
          {post.isRepost && post.repostedBy && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, marginTop: 2 }}>
              <MaterialCommunityIcons name="repeat-variant" size={16} color="#8E8E93" style={{ marginRight: 4 }} />
              <Text style={{ color: '#8E8E93', fontSize: 13, fontStyle: 'italic' }}>
                Reposted by {post.repostedBy.name || 'Someone'}
              </Text>
            </View>
          )}
          {/* Show preview of original post if this is a repost */}
          {post.isRepost && originalPost && (
            <View style={{ borderWidth: 1, borderColor: '#2C2C2E', borderRadius: 10, padding: 8, marginBottom: 0, backgroundColor: '#18181A' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', marginRight: 4 }}>{originalPost.name || 'Anonymous'}</Text>
                <Text style={{ color: '#8E8E93', marginRight: 4 }}>{originalPost.handle || '@unknown'}</Text>
                {originalPost.school && (
                  <View style={[styles.schoolBadge, { marginRight: 4 }]}>
                    <MaterialCommunityIcons name="school" size={10} color="#1DA1F2" />
                    <Text style={[styles.schoolText, { fontSize: 11 }]}>{originalPost.school}</Text>
                  </View>
                )}
                <Text style={{ color: '#8E8E93' }}>· {getTimeAgo(originalPost.timestamp)}</Text>
              </View>
              {originalPost.text ? (
                <Text style={{ color: '#FFFFFF', fontSize: 15, marginBottom: originalPost.image ? 4 : 0 }}>{originalPost.text}</Text>
              ) : null}
              {originalPost.image ? (
                <Image source={{ uri: originalPost.image }} style={{ width: '100%', height: 180, borderRadius: 8, marginTop: 4, backgroundColor: '#222' }} resizeMode="cover" />
              ) : null}
              {/* Show hashtags in original post preview */}
              {originalPost.hashtags && originalPost.hashtags.length > 0 && (
                <View style={[styles.hashtagContainer, { marginTop: 8 }]}>
                  {originalPost.hashtags.map((tag, index) => (
                    <View key={index} style={styles.hashtagTag}>
                      <Text style={styles.hashtagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          {/* Only show body text/image if not a repost, or if repost and text/image are present */}
          {(!post.isRepost && text) ? <Text style={styles.bodyText}>{text}</Text> : null}
          {(!post.isRepost && post.image) ? (<Image source={{ uri: post.image }} style={styles.postImage} />) : null}
          
          {/* Show hashtags if they exist (for regular posts) */}
          {(!post.isRepost && post.hashtags && post.hashtags.length > 0) && (
            <View style={styles.hashtagContainer}>
              {post.hashtags.map((tag, index) => (
                <View key={index} style={styles.hashtagTag}>
                  <Text style={styles.hashtagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          {renderToolbar && renderToolbar()}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postCard: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  avatar: { marginRight: 12, },
  postContent: { flex: 1, },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' },
  nameText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 4, },
  handleText: { color: '#8E8E93', marginRight: 4, },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 161, 242, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
  },
  schoolText: {
    color: '#1DA1F2',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
  },
  locationText: { color: '#8E8E93', },
  timeText: { color: '#8E8E93', },
  bodyText: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, marginTop: 6, },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 12, },
  hashtagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 4,
  },
  hashtagTag: {
    backgroundColor: 'rgba(29, 161, 242, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(29, 161, 242, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  hashtagText: {
    color: '#1DA1F2',
    fontSize: 13,
    fontWeight: '500',
  },
});

export default PostCard;
