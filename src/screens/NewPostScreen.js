import React, { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ScrollView,
  Platform,
  Image,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


const storage = getStorage();

export default function NewPostScreen({ navigation }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [link, setLink] = useState('');
  const [showArticleInput, setShowArticleInput] = useState(false);
  const [article, setArticle] = useState('');
  const [showPollInput, setShowPollInput] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [showHashtagInput, setShowHashtagInput] = useState(false);
  // Pick image from library
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "Permission to access media library is required.");
        return;
      }
      let pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        setImageUri(pickerResult.assets[0].uri);
      }
    } catch (err) {
      console.error("[Post] Error picking image:", err);
      Alert.alert("Image Error", err.message || "Could not pick image.");
    }
  };

  // Upload image to Firebase Storage and return URL
  const uploadImageAsync = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");
      const imageName = `${Date.now()}_${Math.floor(Math.random()*1e6)}.jpg`;
      const storageRef = ref(storage, `posts/${user.uid}/${imageName}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (err) {
      console.error("[Post] Error uploading image:", err);
      throw err;
    }
  };
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // Ensure username is prefixed with '@' for consistency
          data.handle = data.username ? `@${data.username}` : `@user_${user.uid.substring(0, 6)}`;
          setUserProfile(data);
        }
      }
    };
    fetchUserProfile();

    // DEMO POST: Add a demo post to Firestore for feed testing
    const addDemoPost = async () => {
      try {
        const demoPost = {
          userId: 'demoUser',
          name: 'Demo User',
          handle: '@demouser',
          avatar: 'account-circle',
          text: '🚀 This is a demo post! If you see this, your feed is updating.',
          image: null,
          createdAt: serverTimestamp(),
          timestamp: serverTimestamp(),
          likes: [],
          likeCount: 0,
          commentCount: 0,
        };
        await addDoc(collection(db, 'posts'), demoPost);
        console.log('[Demo] Demo post added to Firestore.');
      } catch (e) {
        console.error('[Demo] Failed to add demo post:', e);
      }
    };
    addDemoPost();
  }, []);



  // Handle post submission
  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Authentication Error", "You must be logged in to create a post.");
      return;
    }
    
    // Validate that post has either text content or an image
    const hasTextContent = text.trim().length > 0;
    const hasImage = imageUri !== null;
    
    if (!hasTextContent && !hasImage) {
      Alert.alert("Post Required", "Please add some text or attach an image to your post.");
      return;
    }
    setUploading(true);
    let imageUrl = null;
    try {
      if (imageUri) {
        imageUrl = await uploadImageAsync(imageUri);
      }
      // Prepare post data
      const postData = {
        userId: user.uid,
        name: userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() : 'Anonymous',
        handle: userProfile?.handle || `@user_${user.uid.substring(0, 6)}`,
        avatar: userProfile?.photoURL || 'account-circle',
        school: userProfile?.university || userProfile?.school || '',
        text: text.trim() || '',
        image: imageUrl,
        link: link || null,
        article: article || null,
        poll: pollOptions.filter(opt => opt.trim()),
        hashtags,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
        likes: [],
        likeCount: 0,
        commentCount: 0,
      };
      // Add post to Firestore
      const docRef = await addDoc(collection(db, 'posts'), postData);
      console.log("[Post] Post created with ID:", docRef.id);
      // Emit a global event for post creation, then go back
      DeviceEventEmitter.emit('postCreated');
      navigation.goBack();
    } catch (error) {
      console.error("[Post] Error creating post:", error, error?.stack);
      // Optionally, you could show a non-intrusive error banner here or just return
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BlurView
        intensity={100}
        tint="dark"
        style={styles.backgroundBlur}
      />
      <View style={styles.backgroundOverlay} />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.liquidGlassBox}>
              {/* Main Text Input */}
              <TextInput
                style={styles.liquidGlassInput}
                placeholder="What's on your mind?"
                placeholderTextColor="#8E8E93"
                multiline
                value={text}
                onChangeText={setText}
                editable={!uploading}
                maxLength={280}
              />

              {/* Image Preview - Integrated */}
              {imageUri && (
                <View style={styles.integratedImagePreview}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                    <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Link Input - Integrated */}
              {showLinkInput && (
                <View style={styles.integratedAuxInput}>
                  <MaterialCommunityIcons name="link-variant" size={20} color="#1DA1F2" style={styles.auxIcon} />
                  <TextInput
                    style={styles.integratedInput}
                    placeholder="Paste a link..."
                    placeholderTextColor="#8E8E93"
                    value={link}
                    onChangeText={setLink}
                    editable={!uploading}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                </View>
              )}

              {/* Article Input - Integrated */}
              {showArticleInput && (
                <View style={styles.integratedAuxInput}>
                  <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#1DA1F2" style={styles.auxIcon} />
                  <TextInput
                    style={[styles.integratedInput, { minHeight: 60 }]}
                    placeholder="Write or paste an article..."
                    placeholderTextColor="#8E8E93"
                    value={article}
                    onChangeText={setArticle}
                    editable={!uploading}
                    multiline
                  />
                </View>
              )}

              {/* Poll Input - Integrated */}
              {showPollInput && (
                <View style={styles.integratedAuxInput}>
                  <MaterialCommunityIcons name="poll" size={20} color="#1DA1F2" style={styles.auxIcon} />
                  <View style={styles.pollContainer}>
                    {pollOptions.map((opt, idx) => (
                      <TextInput
                        key={idx}
                        style={styles.pollInput}
                        placeholder={`Poll option ${idx + 1}`}
                        placeholderTextColor="#8E8E93"
                        value={opt}
                        onChangeText={val => setPollOptions(options => options.map((o, i) => i === idx ? val : o))}
                        editable={!uploading}
                      />
                    ))}
                    {pollOptions.length < 4 && (
                      <TouchableOpacity onPress={() => setPollOptions(opts => [...opts, ''])}>
                        <Text style={styles.addOptionText}>+ Add Option</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* Hashtag Input - Integrated */}
              {showHashtagInput && (
                <View style={styles.integratedAuxInput}>
                  <MaterialCommunityIcons name="pound" size={20} color="#1DA1F2" style={styles.auxIcon} />
                  <View style={styles.hashtagContainer}>
                    <View style={styles.hashtagInputRow}>
                      <TextInput
                        style={styles.hashtagInput}
                        placeholder="Add hashtag..."
                        placeholderTextColor="#8E8E93"
                        value={hashtagInput}
                        onChangeText={setHashtagInput}
                        editable={!uploading}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onSubmitEditing={() => {
                          if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
                            setHashtags(hs => [...hs, hashtagInput.trim()]);
                            setHashtagInput('');
                          }
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
                            setHashtags(hs => [...hs, hashtagInput.trim()]);
                            setHashtagInput('');
                          }
                        }}
                        disabled={!hashtagInput.trim() || hashtags.includes(hashtagInput.trim())}
                        style={styles.addHashtagButton}
                      >
                        <MaterialCommunityIcons name="plus-circle" size={20} color="#1DA1F2" />
                      </TouchableOpacity>
                    </View>
                    {hashtags.length > 0 && (
                      <View style={styles.hashtagChips}>
                        {hashtags.map((tag, idx) => (
                          <View key={tag} style={styles.hashtagChip}>
                            <Text style={styles.hashtagText}>#{tag}</Text>
                            <TouchableOpacity onPress={() => setHashtags(hs => hs.filter(t => t !== tag))}>
                              <MaterialCommunityIcons name="close" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Toolbar */}
              <View style={styles.toolbar}>
                <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.toolbarButton}>
                  <MaterialCommunityIcons name="image-plus" size={26} color="#1DA1F2" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowLinkInput(v => !v)} disabled={uploading} style={[styles.toolbarButton, showLinkInput && styles.activeToolbarButton]}>
                  <MaterialCommunityIcons name="link-variant" size={26} color={showLinkInput ? "#fff" : "#1DA1F2"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowArticleInput(v => !v)} disabled={uploading} style={[styles.toolbarButton, showArticleInput && styles.activeToolbarButton]}>
                  <MaterialCommunityIcons name="file-document-edit-outline" size={26} color={showArticleInput ? "#fff" : "#1DA1F2"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowPollInput(v => !v)} disabled={uploading} style={[styles.toolbarButton, showPollInput && styles.activeToolbarButton]}>
                  <MaterialCommunityIcons name="poll" size={26} color={showPollInput ? "#fff" : "#1DA1F2"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowHashtagInput(v => !v)} disabled={uploading} style={[styles.toolbarButton, showHashtagInput && styles.activeToolbarButton]}>
                  <MaterialCommunityIcons name="pound" size={26} color={showHashtagInput ? "#fff" : "#1DA1F2"} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={uploading || (!text.trim() && !imageUri)}
              style={[
                styles.submitButton, 
                (uploading || (!text.trim() && !imageUri)) && { opacity: 0.6 }
              ]}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'transparent',
  },
  backgroundBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  liquidGlassBox: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    minHeight: 120,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 32,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
  },
  liquidGlassInput: {
    color: '#fff',
    fontSize: 20,
    padding: 22,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  integratedImagePreview: {
    marginHorizontal: 16,
    marginBottom: 12,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imagePreview: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 16 
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  integratedAuxInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  auxIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  integratedInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'transparent',
    minHeight: 36,
    textAlignVertical: 'top',
  },
  pollContainer: {
    flex: 1,
  },
  pollInput: {
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addOptionText: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
  },
  hashtagContainer: {
    flex: 1,
  },
  hashtagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hashtagInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  addHashtagButton: {
    padding: 6,
  },
  hashtagChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hashtagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1DA1F2',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 6,
  },
  hashtagText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 4,
    fontSize: 14,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  toolbarButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeToolbarButton: {
    backgroundColor: '#1DA1F2',
  },
  submitButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
    alignSelf: 'center',
    shadowColor: '#1DA1F2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  // Remove unused styles
  imagePreviewContainer: {
    display: 'none',
  },
  auxInputBox: {
    display: 'none',
  },
  auxInput: {
    display: 'none',
  },
  auxInputBoxHashtag: {
    display: 'none',
  },
  centeredContent: {
    display: 'none',
  },
});
