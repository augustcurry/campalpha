import { db, auth } from '../../firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export async function repostToFeed(originalPost) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Not authenticated');

  // Fetch user info
  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const userData = userDoc.exists() ? userDoc.data() : {};

  // Only keep a reference to the original post, not a full copy
  const repost = {
    userId: currentUser.uid,
    name: userData.firstName ? `${userData.firstName} ${userData.lastName}` : userData.username || 'Anonymous',
    handle: userData.username ? `@${userData.username}` : '@unknown',
    photoURL: userData.photoURL || '',
    avatar: userData.avatar || 'account-circle',
    createdAt: serverTimestamp(),
    repostedBy: {
      userId: currentUser.uid,
      name: userData.firstName ? `${userData.firstName} ${userData.lastName}` : userData.username || 'Anonymous',
      handle: userData.username ? `@${userData.username}` : '@unknown',
    },
    isRepost: true,
    originalPostId: originalPost.id,
    likes: [],
    likeCount: 0,
    commentCount: 0,
    text: '', // Optionally allow user to add their own text
  };

  await addDoc(collection(db, 'posts'), repost);
}
