import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Button,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const storage = getStorage();

export default function NewPostScreen({ navigation }) {
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      }
    };
    fetchUserProfile();
  }, []);

  const pickImage = async () => {
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

    if (!pickerResult.cancelled) {
      setImageUri(pickerResult.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");

    const imageName = `${Date.now()}.jpg`;
    const storageRef = ref(storage, `posts/${user.uid}/${imageName}`);

    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleSubmit = async () => {
    if (!text.trim() && !imageUri) {
      Alert.alert("Empty Post", "Please add some text or select an image.");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = null;
      if (imageUri) {
        imageUrl = await uploadImageAsync(imageUri);
      }

      const user = auth.currentUser;
      if (!user || !userProfile) throw new Error("User not logged in or profile not loaded");

      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        name: userProfile.name,
        handle: userProfile.handle,
        avatar: userProfile.avatar,
        text: text.trim() || '',
        image: imageUrl,
        createdAt: serverTimestamp(),
        timestamp: serverTimestamp(),
        likes: [],
        likeCount: 0,
        commentCount: 0,
      });

      Alert.alert("Post created!");
      navigation.goBack();
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Failed to create post", error.message || "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          multiline
          value={text}
          onChangeText={setText}
          editable={!uploading}
        />

        <View style={styles.imagePreviewContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.noImageText}>No image selected</Text>
          )}
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.pickImageButton}>
            <MaterialCommunityIcons name="image-plus" size={28} color="#1DA1F2" />
            <Text style={styles.pickImageText}>Pick Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={uploading}
            style={[styles.submitButton, uploading && { opacity: 0.6 }]}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  contentContainer: { padding: 16, flexGrow: 1 },
  textInput: {
    backgroundColor: '#121212',
    color: '#fff',
    fontSize: 18,
    padding: 12,
    borderRadius: 8,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    marginTop: 20,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: { width: '100%', height: '100%', borderRadius: 12 },
  noImageText: { color: '#888' },
  buttonsRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickImageText: {
    color: '#1DA1F2',
    marginLeft: 8,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});