import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ScrollView
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { collection, query, orderBy, limit, getDocs, doc, addDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, where, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { getTimeAgo } from '../utils/timeUtils';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();

function EventsScreen({ navigation, setTabBarVisible }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [userEvents, setUserEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [avatarCache, setAvatarCache] = useState({});

  // Create event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventImage, setEventImage] = useState(null);
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Ensure tab bar is visible on this screen
  useEffect(() => {
    if (setTabBarVisible) {
      setTabBarVisible(true);
    }
  }, [setTabBarVisible]);

  // Load current user and events on mount
  useEffect(() => {
    loadCurrentUser();
    loadEvents();
  }, []);

  const loadCurrentUser = async () => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Get all events
      const eventsQuery = query(
        collection(db, 'events'),
        orderBy('eventTime', 'asc')
      );
      
      const unsubscribe = onSnapshot(eventsQuery, async (querySnapshot) => {
        const eventsList = [];
        const userIds = new Set();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          eventsList.push({
            id: doc.id,
            ...data,
            eventTime: data.eventTime?.toMillis ? data.eventTime.toMillis() : data.eventTime,
            timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp,
          });
          if (data.creatorId) userIds.add(data.creatorId);
          if (data.attendees) {
            data.attendees.forEach(attendeeId => userIds.add(attendeeId));
          }
        });

        // Load user avatars
        const avatarMap = { ...avatarCache };
        const missingUserIds = Array.from(userIds).filter(uid => !avatarMap[uid]);
        
        if (missingUserIds.length > 0) {
          await Promise.all(missingUserIds.map(async (uid) => {
            try {
              const userDoc = await getDocs(doc(db, 'users', uid));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                avatarMap[uid] = userData.photoURL || '';
              } else {
                avatarMap[uid] = '';
              }
            } catch {
              avatarMap[uid] = '';
            }
          }));
          setAvatarCache(avatarMap);
        }

        setEvents(eventsList);
        
        // Filter user's events
        if (currentUser) {
          const userEventsList = eventsList.filter(event => 
            event.creatorId === currentUser.uid || 
            (event.attendees && event.attendees.includes(currentUser.uid))
          );
          setUserEvents(userEventsList);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "Permission to access media library is required!");
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });

      if (!pickerResult.cancelled && pickerResult.assets && pickerResult.assets.length > 0) {
        setEventImage(pickerResult.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadEventImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const user = auth.currentUser;
      const fileName = `events/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const createEvent = async () => {
    if (!eventTitle.trim() || !eventDescription.trim() || !eventDate.trim() || !eventTime.trim() || !eventLocation.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    try {
      setCreatingEvent(true);
      
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create an event');
        return;
      }

      // Combine date and time
      const eventDateTime = new Date(`${eventDate}T${eventTime}`);
      if (isNaN(eventDateTime.getTime())) {
        Alert.alert('Invalid Date/Time', 'Please enter a valid date and time');
        return;
      }

      let imageURL = null;
      if (eventImage) {
        imageURL = await uploadEventImage(eventImage);
      }

      const eventData = {
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        eventTime: Timestamp.fromDate(eventDateTime),
        location: eventLocation.trim(),
        image: imageURL,
        creatorId: user.uid,
        creatorName: user.displayName || 'Anonymous',
        creatorHandle: user.email ? `@${user.email.split('@')[0]}` : '@unknown',
        attendees: [user.uid],
        attendeesCount: 1,
        timestamp: Timestamp.now(),
        school: currentUser?.university || null,
      };

      await addDoc(collection(db, 'events'), eventData);
      
      // Reset form
      setEventTitle('');
      setEventDescription('');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setEventImage(null);
      setShowCreateModal(false);
      
      Alert.alert('Success', 'Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const toggleRSVP = async (eventId, isAttending) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to RSVP');
        return;
      }

      const eventRef = doc(db, 'events', eventId);
      
      if (isAttending) {
        await updateDoc(eventRef, {
          attendees: arrayRemove(user.uid),
          attendeesCount: events.find(e => e.id === eventId)?.attendeesCount - 1
        });
      } else {
        await updateDoc(eventRef, {
          attendees: arrayUnion(user.uid),
          attendeesCount: events.find(e => e.id === eventId)?.attendeesCount + 1
        });
      }
    } catch (error) {
      console.error('Error toggling RSVP:', error);
      Alert.alert('Error', 'Failed to update RSVP. Please try again.');
    }
  };

  const formatEventDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatEventTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isEventUpcoming = (eventTime) => {
    return new Date(eventTime) > new Date();
  };

  const isUserAttending = (event) => {
    return currentUser && event.attendees && event.attendees.includes(currentUser.uid);
  };

  const renderEventCard = ({ item }) => {
    const isUpcoming = isEventUpcoming(item.eventTime);
    const isAttending = isUserAttending(item);
    const creatorAvatar = avatarCache[item.creatorId] || '';

    return (
      <TouchableOpacity 
        style={[styles.eventCard, !isUpcoming && styles.pastEventCard]}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
      >
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.eventImage} />
        )}
        
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={styles.creatorInfo}>
              {creatorAvatar ? (
                <Image source={{ uri: creatorAvatar }} style={styles.creatorAvatar} />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={24} color="#8E8E93" />
              )}
              <View style={styles.creatorDetails}>
                <Text style={styles.creatorName}>{item.creatorName}</Text>
                <Text style={styles.creatorHandle}>{item.creatorHandle}</Text>
              </View>
            </View>
            <View style={styles.eventStatus}>
              {!isUpcoming ? (
                <Text style={styles.pastEventText}>Past Event</Text>
              ) : (
                <Text style={styles.upcomingEventText}>Upcoming</Text>
              )}
            </View>
          </View>

          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <MaterialCommunityIcons name="calendar" size={16} color="#8E8E93" />
              <Text style={styles.eventDetailText}>{formatEventDate(item.eventTime)}</Text>
            </View>
            <View style={styles.eventDetail}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#8E8E93" />
              <Text style={styles.eventDetailText}>{formatEventTime(item.eventTime)}</Text>
            </View>
            <View style={styles.eventDetail}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#8E8E93" />
              <Text style={styles.eventDetailText} numberOfLines={1}>{item.location}</Text>
            </View>
          </View>

          <View style={styles.eventFooter}>
            <View style={styles.attendeesInfo}>
              <MaterialCommunityIcons name="account-group" size={16} color="#8E8E93" />
              <Text style={styles.attendeesText}>{item.attendeesCount || 0} attending</Text>
            </View>
            
            {isUpcoming && (
              <TouchableOpacity 
                style={[styles.rsvpButton, isAttending && styles.rsvpButtonActive]}
                onPress={() => toggleRSVP(item.id, isAttending)}
              >
                <Text style={[styles.rsvpButtonText, isAttending && styles.rsvpButtonTextActive]}>
                  {isAttending ? 'Cancel RSVP' : 'RSVP'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCreateEventModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowCreateModal(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create Event</Text>
          <TouchableOpacity onPress={createEvent} disabled={creatingEvent}>
            <Text style={[styles.createButton, creatingEvent && styles.createButtonDisabled]}>
              {creatingEvent ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {eventImage ? (
              <Image source={{ uri: eventImage }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="camera-plus" size={32} color="#8E8E93" />
                <Text style={styles.imagePlaceholderText}>Add Event Image</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Event Title"
            placeholderTextColor="#8E8E93"
            value={eventTitle}
            onChangeText={setEventTitle}
            maxLength={100}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Event Description"
            placeholderTextColor="#8E8E93"
            value={eventDescription}
            onChangeText={setEventDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <TextInput
            style={styles.input}
            placeholder="Date (YYYY-MM-DD)"
            placeholderTextColor="#8E8E93"
            value={eventDate}
            onChangeText={setEventDate}
          />

          <TextInput
            style={styles.input}
            placeholder="Time (HH:MM AM/PM)"
            placeholderTextColor="#8E8E93"
            value={eventTime}
            onChangeText={setEventTime}
          />

          <TextInput
            style={styles.input}
            placeholder="Location"
            placeholderTextColor="#8E8E93"
            value={eventLocation}
            onChangeText={setEventLocation}
            maxLength={200}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const getFilteredEvents = () => {
    if (activeTab === 'upcoming') {
      return events.filter(event => isEventUpcoming(event.eventTime));
    } else if (activeTab === 'my-events') {
      return userEvents;
    } else {
      return events.filter(event => !isEventUpcoming(event.eventTime));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NEW EVENTS SCREEN - UPDATED!</Text>
        <TouchableOpacity 
          style={styles.createEventButton}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'my-events' && styles.activeTab]} 
          onPress={() => setActiveTab('my-events')}
        >
          <Text style={[styles.tabText, activeTab === 'my-events' && styles.activeTabText]}>
            My Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'past' && styles.activeTab]} 
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
        </View>
      ) : (
        <FlatList
          data={getFilteredEvents()}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadEvents().finally(() => setRefreshing(false));
              }}
              tintColor="#FFFFFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color="#8E8E93" />
              <Text style={styles.emptyStateText}>
                {activeTab === 'upcoming' ? 'No upcoming events' :
                 activeTab === 'my-events' ? 'You haven\'t joined any events yet' :
                 'No past events'}
              </Text>
              {activeTab === 'upcoming' && (
                <TouchableOpacity 
                  style={styles.createFirstEventButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Text style={styles.createFirstEventText}>Create Your First Event</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {renderCreateEventModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#FF0000' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  createEventButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1DA1F2',
  },
  tabText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1DA1F2',
  },
  eventsList: {
    padding: 16,
    paddingBottom: 100,
  },
  eventCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  pastEventCard: {
    opacity: 0.7,
  },
  eventImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  eventContent: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  creatorHandle: {
    color: '#8E8E93',
    fontSize: 12,
  },
  eventStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
  },
  upcomingEventText: {
    color: '#1DA1F2',
    fontSize: 12,
    fontWeight: '500',
  },
  pastEventText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  eventTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDescription: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventDetailText: {
    color: '#8E8E93',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    color: '#8E8E93',
    fontSize: 14,
    marginLeft: 6,
  },
  rsvpButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1DA1F2',
  },
  rsvpButtonActive: {
    backgroundColor: '#1DA1F2',
  },
  rsvpButtonText: {
    color: '#1DA1F2',
    fontSize: 14,
    fontWeight: '600',
  },
  rsvpButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  createFirstEventButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1DA1F2',
    borderRadius: 20,
  },
  createFirstEventText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  cancelButton: {
    color: '#8E8E93',
    fontSize: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  createButton: {
    color: '#1DA1F2',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonDisabled: {
    color: '#8E8E93',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  imagePicker: {
    marginBottom: 20,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8E8E93',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default EventsScreen;