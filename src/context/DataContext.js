import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { collection, query, onSnapshot, doc, getDoc, orderBy, where } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import dataFetcher from '../services/dataSyncService';

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

  // Fetch user profile using optimized fetcher
  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const profileData = await dataFetcher.fetchUserProfile(userId);
      if (profileData) {
        dispatch({ type: ACTIONS.SET_USER_PROFILE, payload: { uid: userId, ...profileData } });
      }
    } catch (error) {
      console.error('[DataContext] Error fetching user profile:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to load user profile' });
    }
  }, []);

  // Setup optimized real-time data listeners
  const setupDataListeners = useCallback((userId) => {
    // Listen for user profile changes using optimized listener
    const userProfileUnsubscribe = dataFetcher.createOptimizedListener(
      'users',
      {
        filters: { __id__: userId },
        onData: (data) => {
          if (data.length > 0) {
            const profileData = data[0];
            dispatch({ type: ACTIONS.SET_USER_PROFILE, payload: { uid: userId, ...profileData } });
          }
        },
        onError: (error) => {
          console.error('[DataContext] User profile listener error:', error);
        }
      }
    );

    // Listen for posts using optimized listener
    const postsUnsubscribe = dataFetcher.createOptimizedListener(
      'posts',
      {
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: 100,
        onData: async (postList) => {
          const userIds = new Set();
          const processedPosts = postList.map(post => {
            if (post.userId) userIds.add(post.userId);
            return {
              ...post,
              timestamp: post.timestamp?.toMillis ? post.timestamp.toMillis() : post.timestamp,
              event_time: post.event_time?.toMillis ? post.event_time.toMillis() : post.event_time,
            };
          });

          // Fetch missing user data efficiently
          await fetchMissingUserData(Array.from(userIds));
          
          dispatch({ type: ACTIONS.SET_POSTS, payload: processedPosts });
        },
        onError: (error) => {
          console.error('[DataContext] Posts listener error:', error);
          dispatch({ type: ACTIONS.SET_ERROR, payload: 'Failed to load posts' });
        }
      }
    );

    // Listen for following/followers
    const followingUnsubscribe = dataFetcher.createOptimizedListener(
      `users/${userId}/following`,
      {
        onData: (data) => {
          const following = data.map(doc => doc.id);
          dispatch({ type: ACTIONS.SET_FOLLOWING, payload: following });
        }
      }
    );

    const followersUnsubscribe = dataFetcher.createOptimizedListener(
      `users/${userId}/followers`,
      {
        onData: (data) => {
          const followers = data.map(doc => doc.id);
          dispatch({ type: ACTIONS.SET_FOLLOWERS, payload: followers });
        }
      }
    );

    // Listen for notifications
    const notificationsUnsubscribe = dataFetcher.createOptimizedListener(
      `users/${userId}/notifications`,
      {
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: 50,
        onData: (data) => {
          dispatch({ type: ACTIONS.SET_NOTIFICATIONS, payload: data });
        }
      }
    );

    // Listen for events
    const eventsUnsubscribe = dataFetcher.createOptimizedListener(
      'events',
      {
        orderByField: 'startTime',
        orderDirection: 'asc',
        limitCount: 50,
        onData: (data) => {
          dispatch({ type: ACTIONS.SET_EVENTS, payload: data });
        }
      }
    );

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

  // Fetch missing user data for cache using optimized fetcher
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
          const data = await dataFetcher.fetchUserProfile(userId);
          if (data) {
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

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    ...state,
    ...actions,
  }), [state, actions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dataFetcher.cleanupListeners();
      dataFetcher.cleanup();
    };
  }, []);

  // Log performance metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = dataFetcher.getPerformanceMetrics();
      if (metrics.cacheHitRate < 0.5) {
        console.warn('[DataContext] Low cache hit rate:', (metrics.cacheHitRate * 100).toFixed(1) + '%');
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

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