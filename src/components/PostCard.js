import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

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
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  postCard: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  avatar: { marginRight: 12, },
  postContent: { flex: 1, },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, },
  nameText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 4, },
  handleText: { color: '#8E8E93', marginRight: 4, },
  locationText: { color: '#8E8E93', },
  bodyText: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 12, },
});

export default PostCard;
