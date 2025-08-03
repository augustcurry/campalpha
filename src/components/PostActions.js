
import React from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { repostToFeed } from '../services/repost';


export default function PostActions({ post, navigation }) {
  const [isLiked, setIsLiked] = React.useState(false);
  const [likeCount, setLikeCount] = React.useState(post.likeCount || 0);
  const [reposting, setReposting] = React.useState(false);
  const [likes, setLikes] = React.useState(post.likes || []);
  const currentUser = auth.currentUser;

  React.useEffect(() => {
    // Listen to real-time updates for this post's likes and likeCount
    const postRef = doc(db, 'posts', post.id);
    const unsubscribe = onSnapshot(postRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLikes(data.likes || []);
        setLikeCount(data.likeCount || 0);
        setIsLiked(currentUser && (data.likes || []).includes(currentUser.uid));
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [post.id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return;
    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      likeCount: increment(isLiked ? -1 : 1),
    });
  };

  const handleRepost = async () => {
    if (reposting) return;
    setReposting(true);
    try {
      await repostToFeed(post);
      // Optionally show a toast or feedback
    } catch (e) {
      console.error('Repost failed', e);
    }
    setReposting(false);
  };

  const navigateToComments = () => {
    navigation.navigate('PostDetail', { postId: post.id });
  };

  const handleShare = async () => {
    // ...existing share logic...
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
      <TouchableOpacity style={styles.actionButton} onPress={handleRepost} disabled={reposting}>
        <MaterialCommunityIcons name="repeat-variant" size={20} color={reposting ? '#444' : "#8E8E93"} />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
        <MaterialCommunityIcons name="share-variant" size={20} color="#8E8E93" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 2,
    paddingBottom: 2,
    marginRight: 27,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#8E8E93',
    marginLeft: 6,
    fontSize: 14,
  },
});
