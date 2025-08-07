import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { collection, query, onSnapshot, doc, getDoc, orderBy, where } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Action types for the reducer
const ACTIONS = {
  SET_USER: 'SET_USER',
  SET_USER_PROFILE: 'SET_USER_PROFILE',
  SET_POSTS: 'SET_POSTS',
  UPDATE_POST: 'UPDATE_POST',
  ADD_POST: 'ADD_POST',
  REMOVE_POST: 'REMOVE_POST',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  UPDATE_USER_CACHE: 'UPDATE_USER_CACHE',
  SET_SCHOOL_CACHE: 'SET_SCHOOL_CACHE',
  SET_AVATAR_CACHE: 'SET_AVATAR_CACHE',
  CLEAR_CACHE: 'CLEAR_CACHE',
  SET_FOLLOWING: 'SET_FOLLOWING',
  SET_FOLLOWERS: 'SET_FOLLOWERS',
  UPDATE_FOLLOW_STATUS: 'UPDATE_FOLLOW_STATUS',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  SET_EVENTS: 'SET_EVENTS',
  UPDATE_EVENT: 'UPDATE_EVENT',
  SET_SEARCH_RESULTS: 'SET_SEARCH_RESULTS',
  CLEAR_SEARCH: 'CLEAR_SEARCH',
};

// Initial state
const initialState = {
  user: null,
  userProfile: null,
  posts: [],
  loading: true,
  error: null,
  userCache: {}, // Cache for user profiles
  schoolCache: {}, // Cache for school information
  avatarCache: {}, // Cache for avatar URLs
  following: [],
  followers: [],
  notifications: [],
  events: [],
  searchResults: [],
  lastSync: null,
};

// Reducer function
function dataReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload };
    
    case ACTIONS.SET_USER_PROFILE:
      return { ...state, userProfile: action.payload };
    
    case ACTIONS.SET_POSTS:
      return { ...state, posts: action.payload, lastSync: Date.now() };
    
    case ACTIONS.UPDATE_POST:
      return {
        ...state,
        posts: state.posts.map(post => 
          post.id === action.payload.id ? { ...post, ...action.payload } : post
        )
      };
    
    case ACTIONS.ADD_POST:
      return {
        ...state,
        posts: [action.payload, ...state.posts]
      };
    
    case ACTIONS.REMOVE_POST:
      return {
        ...state,
        posts: state.posts.filter(post => post.id !== action.payload)
      };
    
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ACTIONS.UPDATE_USER_CACHE:
      return {
        ...state,
        userCache: { ...state.userCache, ...action.payload }
      };
    
    case ACTIONS.SET_SCHOOL_CACHE:
      return { ...state, schoolCache: action.payload };
    
    case ACTIONS.SET_AVATAR_CACHE:
      return { ...state, avatarCache: action.payload };
    
    case ACTIONS.CLEAR_CACHE:
      return {
        ...state,
        userCache: {},
        schoolCache: {},
        avatarCache: {}
      };
    
    case ACTIONS.SET_FOLLOWING:
      return { ...state, following: action.payload };
    
    case ACTIONS.SET_FOLLOWERS:
      return { ...state, followers: action.payload };
    
    case ACTIONS.UPDATE_FOLLOW_STATUS:
      return {
        ...state,
        following: action.payload.isFollowing 
          ? [...state.following, action.payload.userId]
          : state.following.filter(id => id !== action.payload.userId)
      };
    
    case ACTIONS.SET_NOTIFICATIONS:
      return { ...state, notifications: action.payload };
    
    case ACTIONS.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id 
            ? { ...notification, ...action.payload }
            : notification
        )
      };
    
    case ACTIONS.SET_EVENTS:
      return { ...state, events: action.payload };
    
    case ACTIONS.UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map(event =>
          event.id === action.payload.id 
            ? { ...event, ...action.payload }
            : event
        )
      };
    
    case ACTIONS.SET_SEARCH_RESULTS:
      return { ...state, searchResults: action.payload };
    
    case ACTIONS.CLEAR_SEARCH:
      return { ...state, searchResults: [] };
    
    default:
      return state;
  }
}

// Create context
const DataContext = createContext();

// Provider component
export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: ACTIONS.SET_USER, payload: user });
      if (user) {
        fetchUserProfile(user.uid);
        setupDataListeners(user.uid);
      } else {
        // Clear all data when user logs out
        dispatch({ type: ACTIONS.CLEAR_CACHE });
        dispatch({ type: ACTIONS.SET_POSTS, payload: [] });
        dispatch({ type: ACTIONS.SET_FOLLOWING, payload: [] });
        dispatch({ type: ACTIONS.SET_FOLLOWERS, payload: [] });
        dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: [] });
        dispatch({ type: ACTIONS.SET_EVENTS, payload: [] });
        dispatch({ type: ACTIONS.SET_SEARCH_RESULTS, payload: [] });
      }
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    });

    return unsubscribe;
  }, []);

  // Fetch user profile
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        dispatch({ type: ACTIONS.SET_USER_PROFILE, payload: { uid: userId, ...profileData } });
      }
    } catch (error) {
      console.error('[DataContext] Error fetching user profile:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to load user profile' });
    }
  }, []);

  // Setup real-time data listeners
  const setupDataListeners = useCallback((userId) => {
    // Listen for user profile changes
    const userProfileUnsubscribe = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        const profileData = doc.data();
        dispatch({ type: ACTIONS.SET_USER_PROFILE, payload: { uid: userId, ...profileData } });
      }
    });

    // Listen for posts
    const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const postsUnsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
      const posts = [];
      const userIds = new Set();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        posts.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp,
          event_time: data.event_time?.toMillis ? data.event_time.toMillis() : data.event_time,
        });
        if (data.userId) userIds.add(data.userId);
      });

      dispatch({ type: ACTIONS.SET_POSTS, payload: posts });
      
      // Fetch missing user data for cache
      fetchMissingUserData(Array.from(userIds));
    });

    // Listen for following/followers (if you have these collections)
    const followingQuery = query(collection(db, 'users', userId, 'following'));
    const followingUnsubscribe = onSnapshot(followingQuery, (querySnapshot) => {
      const following = [];
      querySnapshot.forEach((doc) => {
        following.push(doc.id);
      });
      dispatch({ type: ACTIONS.SET_FOLLOWING, payload: following });
    });

    const followersQuery = query(collection(db, 'users', userId, 'followers'));
    const followersUnsubscribe = onSnapshot(followersQuery, (querySnapshot) => {
      const followers = [];
      querySnapshot.forEach((doc) => {
        followers.push(doc.id);
      });
      dispatch({ type: ACTIONS.SET_FOLLOWERS, payload: followers });
    });

    // Listen for notifications
    const notificationsQuery = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('createdAt', 'desc')
    );
    const notificationsUnsubscribe = onSnapshot(notificationsQuery, (querySnapshot) => {
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: notifications });
    });

    // Listen for events
    const eventsQuery = query(collection(db, 'events'), orderBy('startTime', 'asc'));
    const eventsUnsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
      const events = [];
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });
      dispatch({ type: ACTIONS.SET_EVENTS, payload: events });
    });

    // Return cleanup function
    return () => {
      userProfileUnsubscribe();
      postsUnsubscribe();
      followingUnsubscribe();
      followersUnsubscribe();
      notificationsUnsubscribe();
      eventsUnsubscribe();
    };
  }, []);

  // Fetch missing user data for cache
  const fetchMissingUserData = useCallback(async (userIds) => {
    const currentCache = state.userCache;
    const missingIds = userIds.filter(id => !currentCache[id]);
    
    if (missingIds.length === 0) return;

    const userData = {};
    const schoolData = {};
    const avatarData = {};

    await Promise.all(
      missingIds.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            userData[userId] = data;
            schoolData[userId] = data.university || data.school || '';
            avatarData[userId] = data.photoURL || '';
          } else {
            userData[userId] = null;
            schoolData[userId] = '';
            avatarData[userId] = '';
          }
        } catch (error) {
          console.error(`[DataContext] Error fetching user ${userId}:`, error);
          userData[userId] = null;
          schoolData[userId] = '';
          avatarData[userId] = '';
        }
      })
    );

    dispatch({ type: ACTIONS.UPDATE_USER_CACHE, payload: userData });
    dispatch({ type: ACTIONS.SET_SCHOOL_CACHE, payload: { ...state.schoolCache, ...schoolData } });
    dispatch({ type: ACTIONS.SET_AVATAR_CACHE, payload: { ...state.avatarCache, ...avatarData } });
  }, [state.userCache, state.schoolCache, state.avatarCache]);

  // Action creators
  const actions = {
    // Post actions
    updatePost: (postId, updates) => {
      dispatch({ type: ACTIONS.UPDATE_POST, payload: { id: postId, ...updates } });
    },

    addPost: (post) => {
      dispatch({ type: ACTIONS.ADD_POST, payload: post });
    },

    removePost: (postId) => {
      dispatch({ type: ACTIONS.REMOVE_POST, payload: postId });
    },

    // User actions
    updateUserProfile: (updates) => {
      dispatch({ type: ACTIONS.SET_USER_PROFILE, payload: { ...state.userProfile, ...updates } });
    },

    // Following actions
    updateFollowStatus: (userId, isFollowing) => {
      dispatch({ type: ACTIONS.UPDATE_FOLLOW_STATUS, payload: { userId, isFollowing } });
    },

    // Notification actions
    updateNotification: (notificationId, updates) => {
      dispatch({ type: ACTIONS.UPDATE_NOTIFICATION, payload: { id: notificationId, ...updates } });
    },

    // Event actions
    updateEvent: (eventId, updates) => {
      dispatch({ type: ACTIONS.UPDATE_EVENT, payload: { id: eventId, ...updates } });
    },

    // Search actions
    setSearchResults: (results) => {
      dispatch({ type: ACTIONS.SET_SEARCH_RESULTS, payload: results });
    },

    clearSearch: () => {
      dispatch({ type: ACTIONS.CLEAR_SEARCH });
    },

    // Cache actions
    updateUserCache: (userData) => {
      dispatch({ type: ACTIONS.UPDATE_USER_CACHE, payload: userData });
    },

    clearCache: () => {
      dispatch({ type: ACTIONS.CLEAR_CACHE });
    },

    // Utility actions
    setLoading: (loading) => {
      dispatch({ type: ACTIONS.SET_LOADING, payload: loading });
    },

    setError: (error) => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: error });
    },

    clearError: () => {
      dispatch({ type: ACTIONS.SET_ERROR, payload: null });
    },
  };

  const value = {
    ...state,
    ...actions,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Custom hook to use the data context
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Specialized hooks for specific data
export function useUser() {
  const { user, userProfile } = useData();
  return { user, userProfile };
}

export function usePosts() {
  const { posts, loading, error, updatePost, addPost, removePost } = useData();
  return { posts, loading, error, updatePost, addPost, removePost };
}

export function useUserCache() {
  const { userCache, schoolCache, avatarCache, updateUserCache } = useData();
  return { userCache, schoolCache, avatarCache, updateUserCache };
}

export function useFollowing() {
  const { following, followers, updateFollowStatus } = useData();
  return { following, followers, updateFollowStatus };
}

export function useNotifications() {
  const { notifications, updateNotification } = useData();
  return { notifications, updateNotification };
}

export function useEvents() {
  const { events, updateEvent } = useData();
  return { events, updateEvent };
}

export function useSearch() {
  const { searchResults, setSearchResults, clearSearch } = useData();
  return { searchResults, setSearchResults, clearSearch };
}