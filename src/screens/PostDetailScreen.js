import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  collection,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

// --- PostCard Component ---
const PostCard = ({ post, navigation }) => {
  const name = post.name || 'Anonymous';
  const handle = post.handle || '@unknown';
  const postDate = post.createdAt?.toDate();
  const formattedDate = postDate
    ? `${postDate.toLocaleTimeString()} · ${postDate.toLocaleDateString()}`
    : 'Just now';
  const avatar = post.avatar || 'account-circle';

  const navigateToProfile = () => {
    if (post.userId) {
      navigation.navigate('Profile', { userId: post.userId });
    }
  };

  return (
    <View style={styles.postCard}>
      <TouchableOpacity onPress={navigateToProfile}>
        <MaterialCommunityIcons
          name={avatar}
          size={50}
          color="#8E8E93"
          style={styles.avatar}
        />
      </TouchableOpacity>
      <View style={styles.postContent}>
        <View style={styles.postHeader}>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.handleText}>{handle}</Text>
        </View>
        <Text style={styles.bodyText}>{post.text || ''}</Text>
        {post.image && (
          <Image source={{ uri: post.image }} style={styles.postImage} />
        )}
        <Text style={styles.timestampText}>{formattedDate}</Text>
      </View>
    </View>
  );
};

// --- ActionBar Component ---
const ActionBar = ({ post, postId }) => {
  const currentUser = auth.currentUser;
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  useEffect(() => {
    setIsLiked(currentUser && post.likes?.includes(currentUser.uid));
    setLikeCount(post.likeCount || 0);
  }, [post, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return;
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      likeCount: increment(isLiked ? -1 : 1),
    });
  };

  return (
    <View style={styles.actionBar}>
      <TouchableOpacity style={styles.actionButton}>
        <MaterialCommunityIcons name="comment-outline" size={22} color="#8E8E93" />
        <Text style={styles.actionText}>{post.commentCount || 0}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <MaterialCommunityIcons name="twitter-retweet" size={22} color="#8E8E93" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
        <MaterialCommunityIcons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={22}
          color={isLiked ? '#E0245E' : '#8E8E93'}
        />
        <Text style={[styles.actionText, isLiked && { color: '#E0245E' }]}>
          {likeCount}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <MaterialCommunityIcons name="bookmark-outline" size={22} color="#8E8E93" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton}>
        <MaterialCommunityIcons name="share-outline" size={22} color="#8E8E93" />
      </TouchableOpacity>
    </View>
  );
};

// --- CommentInput Component ---
const CommentInput = ({ postId, parentId = null, parentUsername = null, onCommentPosted }) => {
  const [commentText, setCommentText] = useState('');
  const currentUser = auth.currentUser;

  const handleAddComment = async () => {
    console.log('Send button pressed');
    console.log('Current user:', currentUser);
    console.log('Comment text:', commentText);

    if (!commentText.trim()) {
      console.warn('Empty comment, not posting');
      return;
    }

    if (!currentUser) {
      console.warn('No authenticated user, cannot post comment');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let commenterInfo = {
        displayName: 'Anonymous',
        username: 'unknown',
        avatar: 'account-circle',
      };
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
        commenterInfo.displayName = name || userData.username;
        commenterInfo.username = userData.username || 'unknown';
        commenterInfo.avatar = userData.avatarUrl || 'account-circle';
      }

      const commentsCollectionRef = collection(db, 'posts', postId, 'comments');
      await addDoc(commentsCollectionRef, {
        text: commentText,
        userId: currentUser.uid,
        displayName: commenterInfo.displayName,
        username: commenterInfo.username,
        userAvatar: commenterInfo.avatar,
        createdAt: serverTimestamp(),
        parentId: parentId,
        replyingTo: parentUsername,
        likes: [],
        likeCount: 0,
      });

      if (!parentId) {
        const postRef = doc(db, 'posts', postId);
        await updateDoc(postRef, { commentCount: increment(1) });
      }

      setCommentText('');
      if (onCommentPosted) onCommentPosted();

      console.log('Comment posted successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <View style={styles.commentInputContainer}>
      <TextInput
        style={styles.commentInput}
        placeholder="Add a comment..."
        placeholderTextColor="#8E8E93"
        value={commentText}
        onChangeText={setCommentText}
      />
      <TouchableOpacity onPress={handleAddComment}>
        <MaterialCommunityIcons name="send-circle" size={32} color="#1DA1F2" />
      </TouchableOpacity>
    </View>
  );
};

// --- CommentCard Component ---
const CommentCard = ({ comment, postId, navigation, depth = 0 }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const currentUser = auth.currentUser;

  // --- Display logic ---
  const displayName = comment.displayName || comment.username || 'Anonymous';
  const handle = comment.username || 'unknown';

  useEffect(() => {
    setIsLiked(currentUser && comment.likes?.includes(currentUser.uid));
    setLikeCount(comment.likeCount || 0);
  }, [comment, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return;
    const commentRef = doc(db, 'posts', postId, 'comments', comment.id);
    await updateDoc(commentRef, {
      likes: isLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      likeCount: increment(isLiked ? -1 : 1),
    });
  };

  return (
    <View style={[styles.commentWrapper, depth > 0 && { marginLeft: 15 }]}>
      {depth > 0 && <View style={styles.threadLine} />}
      <View style={{ flex: 1 }}>
        <View style={styles.commentCard}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile', { userId: comment.userId })}
          >
            <MaterialCommunityIcons
              name={comment.userAvatar || 'account-circle'}
              size={40}
              color="#8E8E93"
              style={styles.commentAvatar}
            />
          </TouchableOpacity>
          <View style={styles.commentContent}>
            <View style={styles.commentUserHeader}>
              <Text style={styles.nameText}>{displayName}</Text>
              <Text style={styles.handleText}>@{handle}</Text>
              {comment.replyingTo && (
                <View style={styles.replyingToContainer}>
                  <MaterialCommunityIcons name="arrow-right-thin" size={16} color="#8E8E93" />
                  <Text style={styles.handleText}>@{comment.replyingTo}</Text>
                </View>
              )}
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>
            <View style={styles.commentActions}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <MaterialCommunityIcons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isLiked ? '#E0245E' : '#8E8E93'}
                />
                <Text style={[styles.commentActionText, isLiked && { color: '#E0245E' }]}>
                  {likeCount > 0 && likeCount}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowReplyInput(!showReplyInput)}
                style={styles.actionButton}
              >
                <MaterialCommunityIcons name="reply" size={18} color="#8E8E93" />
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {showReplyInput && (
          <View style={{ marginTop: 10 }}>
            <CommentInput
              postId={postId}
              parentId={comment.id}
              parentUsername={comment.username}
              onCommentPosted={() => setShowReplyInput(false)}
            />
          </View>
        )}
        {comment.replies?.map((reply) => (
          <CommentCard
            key={reply.id}
            comment={reply}
            postId={postId}
            navigation={navigation}
            depth={depth + 1}
          />
        ))}
      </View>
    </View>
  );
};

// --- Main PostDetailScreen ---
export default function PostDetailScreen({ route, navigation }) {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const postDocRef = doc(db, 'posts', postId);
    const unsubscribePost = onSnapshot(postDocRef, (docSnap) => {
      if (docSnap.exists()) setPost({ id: docSnap.id, ...docSnap.data() });
      setLoading(false);
    });

    const commentsQuery = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeComments = onSnapshot(commentsQuery, (querySnapshot) => {
      const allComments = [];
      querySnapshot.forEach((doc) => allComments.push({ id: doc.id, ...doc.data() }));

      const commentMap = {};
      const nestedComments = [];
      allComments.forEach((comment) => (commentMap[comment.id] = { ...comment, replies: [] }));
      allComments.forEach((comment) => {
        if (comment.parentId) {
          commentMap[comment.parentId]?.replies.push(commentMap[comment.id]);
        } else {
          nestedComments.push(commentMap[comment.id]);
        }
      });
      setComments(nestedComments);
    });

    return () => {
      unsubscribePost();
      unsubscribeComments();
    };
  }, [postId]);

  if (loading)
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );

  if (!post)
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#1DA1F2" />
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <Text style={styles.text}>Post not found.</Text>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#1DA1F2" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <>
              <PostCard post={post} navigation={navigation} />
              <ActionBar post={post} postId={postId} />
              <View style={styles.commentSectionHeader}>
                <Text style={styles.commentHeader}>Comments</Text>
              </View>
            </>
          )}
          renderItem={({ item }) => (
            <CommentCard comment={item} postId={postId} navigation={navigation} depth={0} />
          )}
        />

        <CommentInput postId={postId} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#FFFFFF', fontSize: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  postCard: { flexDirection: 'row', padding: 16 },
  avatar: { marginRight: 12 },
  postContent: { flex: 1 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' },
  nameText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 5, fontSize: 15 },
  handleText: { color: '#8E8E93', fontSize: 15 },
  bodyText: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, marginVertical: 8 },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 12 },
  timestampText: { color: '#8E8E93', fontSize: 14, marginTop: 12 },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#8E8E93', marginLeft: 6, fontSize: 14 },
  commentSectionHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  commentHeader: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  commentWrapper: { flexDirection: 'row', paddingRight: 16 },
  threadLine: { width: 2, backgroundColor: '#2C2C2E', marginRight: 10 },
  commentCard: { flexDirection: 'row', paddingVertical: 12 },
  commentAvatar: { marginRight: 10 },
  commentContent: { flex: 1 },
  commentUserHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 },
  replyingToContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  commentText: { color: '#D1D1D6', marginTop: 4 },
  commentActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 20 },
  commentActionText: { color: '#8E8E93', marginLeft: 4, fontSize: 13 },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
});