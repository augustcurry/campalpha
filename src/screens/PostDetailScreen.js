import React, { useState, useEffect, useRef } from 'react';
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
import { repostToFeed } from '../services/repost';

// --- PostCard Component ---
const PostCard = ({ post, navigation }) => {
  const name = post.name || 'Anonymous';
  const handle = post.handle || '@unknown';
  const postDate = post.createdAt?.toDate();
  // Format time as HH:MM AM/PM (no seconds)
  const formattedDate = postDate
    ? `${postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${postDate.toLocaleDateString()}`
    : 'Just now';
  const photoURL = post.photoURL || null;
  const avatar = post.avatar || 'account-circle';

  const [avatarLoaded, setAvatarLoaded] = React.useState(false);

  const navigateToProfile = () => {
    if (post.userId) {
      navigation.navigate('Profile', { userId: post.userId });
    }
  };

  return (
    <View style={styles.postCard}>
      <TouchableOpacity onPress={navigateToProfile}>
        {photoURL ? (
          <View style={{ width: 50, height: 50, marginRight: 12, borderRadius: 25, backgroundColor: '#18181A', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
            {!avatarLoaded && (
              <MaterialCommunityIcons
                name={avatar}
                size={40}
                color="#232325"
                style={{ position: 'absolute', left: 5, top: 5 }}
              />
            )}
            <Image
              source={{ uri: photoURL }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
              onLoad={() => setAvatarLoaded(true)}
              onError={() => setAvatarLoaded(true)}
            />
          </View>
        ) : (
          <MaterialCommunityIcons
            name={avatar}
            size={50}
            color="#8E8E93"
            style={styles.avatar}
          />
        )}
      </TouchableOpacity>
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
        </View>
        {post.isRepost && post.repostedBy && (
          <View style={styles.repostIndicator}>
            <MaterialCommunityIcons name="repeat-variant" size={16} color="#8E8E93" style={{ marginRight: 4 }} />
            <Text style={styles.repostText}>
              Reposted by {post.repostedBy.name || 'Someone'}
            </Text>
          </View>
        )}
        <Text style={styles.bodyText}>{post.text || ''}</Text>
        {post.image && (
          <Image source={{ uri: post.image }} style={styles.postImage} />
        )}
        
        {/* Show hashtags if they exist */}
        {post.hashtags && post.hashtags.length > 0 && (
          <View style={styles.hashtagContainer}>
            {post.hashtags.map((tag, index) => (
              <View key={index} style={styles.hashtagTag}>
                <Text style={styles.hashtagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
        
        <Text style={styles.timestampText}>{formattedDate}</Text>
      </View>
    </View>
  );
};

// --- ActionBar Component ---
const ActionBar = ({ post, postId, onCommentPress }) => {
  const currentUser = auth.currentUser;
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [reposting, setReposting] = useState(false);

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

  return (
    <View style={styles.actionBar}>
      <TouchableOpacity style={styles.actionButton} onPress={onCommentPress}>
        <MaterialCommunityIcons name="comment-outline" size={22} color="#8E8E93" />
        <Text style={styles.actionText}>{post.commentCount || 0}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={handleRepost} disabled={reposting}>
        <MaterialCommunityIcons name="repeat-variant" size={22} color={reposting ? '#444' : '#8E8E93'} />
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
const CommentInput = React.forwardRef(({ postId, parentId = null, parentUsername = null, onCommentPosted, onBlur }, ref) => {
  const [commentText, setCommentText] = useState('');
  const currentUser = auth.currentUser;

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!currentUser) return;
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
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <View style={styles.commentInputContainer}>
      <TextInput
        ref={ref}
        style={styles.commentInput}
        placeholder="Add a comment..."
        placeholderTextColor="#8E8E93"
        value={commentText}
        onChangeText={setCommentText}
        onBlur={onBlur}
        autoFocus
      />
      <TouchableOpacity onPress={handleAddComment}>
        <MaterialCommunityIcons name="send-circle" size={32} color="#1DA1F2" />
      </TouchableOpacity>
    </View>
  );
});

// --- CommentCard Component ---
const CommentCard = ({ comment, postId, navigation, depth = 0, activeInput, setActiveInput }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  const inputRef = useRef(null);
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

  const handleReply = () => {
    setActiveInput({ parentId: comment.id, parentUsername: comment.username });
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

  // Only render the reply input for the top-most matching comment in the visible tree
  let replyInputRendered = false;
  const renderReplies = (replies) => {
    return replies?.map((reply) => (
      <CommentCard
        key={reply.id}
        comment={reply}
        postId={postId}
        navigation={navigation}
        depth={depth + 1}
        activeInput={activeInput}
        setActiveInput={setActiveInput}
      />
    ));
  };

  let showReplyInput = false;
  if (activeInput && activeInput.parentId === comment.id) {
    // Only show the reply input if none of the replies also match activeInput
    showReplyInput = !comment.replies?.some(r => r.id === activeInput.parentId);
  }

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
                onPress={handleReply}
                style={styles.actionButton}
              >
                <MaterialCommunityIcons name="reply" size={18} color="#8E8E93" />
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Always show the reply input for the comment being replied to, even if main input is hidden */}
        {activeInput && activeInput.parentId === comment.id && (
          <View style={{ marginTop: 10 }}>
            <CommentInput
              ref={inputRef}
              postId={postId}
              parentId={comment.id}
              parentUsername={comment.username}
              onCommentPosted={() => setActiveInput(null)}
              onBlur={() => setActiveInput(null)}
            />
          </View>
        )}
        {renderReplies(comment.replies)}
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
  const [activeInput, setActiveInput] = useState(null); // { parentId, parentUsername }
  const inputRef = useRef(null);

  useEffect(() => {
    const postDocRef = doc(db, 'posts', postId);
    let unsubUser = null;
    const unsubscribePost = onSnapshot(postDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const postData = docSnap.data();
        let userProfile = {};
        if (postData.userId) {
          const userDocRef = doc(db, 'users', postData.userId);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            userProfile = userDocSnap.data();
          }
        }
        setPost({
          id: docSnap.id,
          ...postData,
          photoURL: userProfile.photoURL || '',
          avatar: userProfile.avatar || 'account-circle',
          name: userProfile.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : postData.name,
          handle: userProfile.username ? `@${userProfile.username}` : postData.handle,
        });
      }
      setLoading(false);
    });

    const commentsQuery = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribeComments = onSnapshot(commentsQuery, (querySnapshot) => {
      const allComments = [];
      querySnapshot.forEach((doc) => allComments.push({ id: doc.id, ...doc.data() }));

      // Helper to recursively sort replies by createdAt
      function sortReplies(commentsArr) {
        return commentsArr
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return aTime - bTime;
          })
          .map(comment => ({
            ...comment,
            replies: comment.replies ? sortReplies(comment.replies) : [],
          }));
      }

      const commentMap = {};
      const nestedComments = [];
      allComments.forEach((comment) => (commentMap[comment.id] = { ...comment, replies: [] }));
      // Attach replies to their parent if parent exists, otherwise treat as top-level
      allComments.forEach((comment) => {
        if (comment.parentId && commentMap[comment.parentId]) {
          commentMap[comment.parentId].replies.push(commentMap[comment.id]);
        } else if (!comment.parentId) {
          nestedComments.push(commentMap[comment.id]);
        } else {
          // Orphaned reply (parent deleted), treat as top-level
          nestedComments.push(commentMap[comment.id]);
        }
      });
      setComments(sortReplies(nestedComments));
    });

    return () => {
      unsubscribePost();
      unsubscribeComments();
      if (unsubUser) unsubUser();
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

  // Handler for main comment button
  const handleMainComment = () => {
    setActiveInput({ parentId: null, parentUsername: null });
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 100);
  };

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
              <ActionBar post={post} postId={postId} onCommentPress={handleMainComment} />
              <View style={styles.commentSectionHeader}>
                <Text style={styles.commentHeader}>Comments</Text>
              </View>
            </>
          )}
          renderItem={({ item }) => (
            <CommentCard
              comment={item}
              postId={postId}
              navigation={navigation}
              depth={0}
              activeInput={activeInput}
              setActiveInput={setActiveInput}
            />
          )}
        />

        {/* Only show the main comment input if not replying to a comment */}
        {activeInput && activeInput.parentId !== null ? null : (
          activeInput && activeInput.parentId === null ? (
            <CommentInput
              ref={inputRef}
              postId={postId}
              onCommentPosted={() => setActiveInput(null)}
              onBlur={() => setActiveInput(null)}
            />
          ) : (
            <View style={styles.commentInputContainer}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#1C1C1E', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 }}
                onPress={handleMainComment}
              >
                <Text style={{ color: '#8E8E93' }}>Add a comment...</Text>
              </TouchableOpacity>
              <MaterialCommunityIcons name="send-circle" size={32} color="#444" style={{ marginLeft: 8 }} />
            </View>
          )
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  repostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 2,
    gap: 2,
  },
  repostText: {
    color: '#8E8E93',
    fontSize: 13,
    fontStyle: 'italic',
  },
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
  handleText: { color: '#8E8E93', fontSize: 15, marginRight: 5 },
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
  bodyText: { color: '#FFFFFF', fontSize: 18, lineHeight: 24, marginVertical: 8 },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 12 },
  timestampText: { color: '#8E8E93', fontSize: 14, marginTop: 12 },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
    marginHorizontal: 0,
    gap: 0,
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