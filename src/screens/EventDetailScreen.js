import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  FlatList,
  Alert
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { getTimeAgo } from '../utils/timeUtils';

function EventDetailScreen({ route, navigation, setTabBarVisible }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAttending, setIsAttending] = useState(false);

  // Ensure tab bar is hidden on this screen
  useEffect(() => {
    if (setTabBarVisible) {
      setTabBarVisible(false);
    }
  }, [setTabBarVisible]);

  useEffect(() => {
    loadCurrentUser();
    loadEventDetails();
  }, [eventId]);

  const loadCurrentUser = async () => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser(user);
    }
  };

  const loadEventDetails = async () => {
    try {
      setLoading(true);
      
      const eventRef = doc(db, 'events', eventId);
      const unsubscribe = onSnapshot(eventRef, async (docSnap) => {
        if (docSnap.exists()) {
          const eventData = docSnap.data();
          const eventWithId = {
            id: docSnap.id,
            ...eventData,
            eventTime: eventData.eventTime?.toMillis ? eventData.eventTime.toMillis() : eventData.eventTime,
            timestamp: eventData.timestamp?.toMillis ? eventData.timestamp.toMillis() : eventData.timestamp,
          };
          
          setEvent(eventWithId);
          
          // Check if current user is attending
          if (currentUser && eventData.attendees) {
            setIsAttending(eventData.attendees.includes(currentUser.uid));
          }
          
          // Load attendees details
          if (eventData.attendees && eventData.attendees.length > 0) {
            const attendeesList = [];
            for (const attendeeId of eventData.attendees) {
              try {
                const userDoc = await getDoc(doc(db, 'users', attendeeId));
                if (userDoc.exists()) {
                  attendeesList.push({ id: attendeeId, ...userDoc.data() });
                }
              } catch (error) {
                console.error('Error loading attendee:', error);
              }
            }
            setAttendees(attendeesList);
          }
        } else {
          Alert.alert('Error', 'Event not found');
          navigation.goBack();
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading event details:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const toggleRSVP = async () => {
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
          attendeesCount: event.attendeesCount - 1
        });
        setIsAttending(false);
      } else {
        await updateDoc(eventRef, {
          attendees: arrayUnion(user.uid),
          attendeesCount: event.attendeesCount + 1
        });
        setIsAttending(true);
      }
    } catch (error) {
      console.error('Error toggling RSVP:', error);
      Alert.alert('Error', 'Failed to update RSVP. Please try again.');
    }
  };

  const formatEventDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
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

  const renderAttendee = ({ item }) => (
    <TouchableOpacity 
      style={styles.attendeeItem}
      onPress={() => navigation.navigate('Profile', { userId: item.id })}
    >
      {item.photoURL ? (
        <Image source={{ uri: item.photoURL }} style={styles.attendeeAvatar} />
      ) : (
        <MaterialCommunityIcons name="account-circle" size={40} color="#8E8E93" />
      )}
      <View style={styles.attendeeInfo}>
        <Text style={styles.attendeeName}>{item.name || 'Anonymous'}</Text>
        <Text style={styles.attendeeHandle}>{item.handle || '@unknown'}</Text>
        {item.university && (
          <View style={styles.schoolBadge}>
            <MaterialCommunityIcons name="school" size={12} color="#1DA1F2" />
            <Text style={styles.schoolText}>{item.university}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DA1F2" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isUpcoming = isEventUpcoming(event.eventTime);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        {event.image && (
          <Image source={{ uri: event.image }} style={styles.eventImage} />
        )}

        <View style={styles.content}>
          <View style={styles.eventHeader}>
            <View style={styles.creatorInfo}>
              {event.creatorPhotoURL ? (
                <Image source={{ uri: event.creatorPhotoURL }} style={styles.creatorAvatar} />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={32} color="#8E8E93" />
              )}
              <View style={styles.creatorDetails}>
                <Text style={styles.creatorName}>{event.creatorName}</Text>
                <Text style={styles.creatorHandle}>{event.creatorHandle}</Text>
                <Text style={styles.createdTime}>Created {getTimeAgo(event.timestamp)}</Text>
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

          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>

          <View style={styles.eventDetails}>
            <View style={styles.eventDetail}>
              <MaterialCommunityIcons name="calendar" size={20} color="#8E8E93" />
              <View style={styles.eventDetailContent}>
                <Text style={styles.eventDetailLabel}>Date</Text>
                <Text style={styles.eventDetailValue}>{formatEventDate(event.eventTime)}</Text>
              </View>
            </View>

            <View style={styles.eventDetail}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#8E8E93" />
              <View style={styles.eventDetailContent}>
                <Text style={styles.eventDetailLabel}>Time</Text>
                <Text style={styles.eventDetailValue}>{formatEventTime(event.eventTime)}</Text>
              </View>
            </View>

            <View style={styles.eventDetail}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#8E8E93" />
              <View style={styles.eventDetailContent}>
                <Text style={styles.eventDetailLabel}>Location</Text>
                <Text style={styles.eventDetailValue}>{event.location}</Text>
              </View>
            </View>

            {event.school && (
              <View style={styles.eventDetail}>
                <MaterialCommunityIcons name="school" size={20} color="#8E8E93" />
                <View style={styles.eventDetailContent}>
                  <Text style={styles.eventDetailLabel}>School</Text>
                  <Text style={styles.eventDetailValue}>{event.school}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.attendeesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Attendees ({event.attendeesCount || 0})</Text>
            </View>
            
            {attendees.length > 0 ? (
              <FlatList
                data={attendees}
                renderItem={renderAttendee}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                style={styles.attendeesList}
              />
            ) : (
              <Text style={styles.noAttendeesText}>No attendees yet</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {isUpcoming && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.rsvpButton, isAttending && styles.rsvpButtonActive]}
            onPress={toggleRSVP}
          >
            <Text style={[styles.rsvpButtonText, isAttending && styles.rsvpButtonTextActive]}>
              {isAttending ? 'Cancel RSVP' : 'RSVP'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#000000' 
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
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  eventImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  creatorHandle: {
    color: '#8E8E93',
    fontSize: 14,
  },
  createdTime: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  eventDescription: {
    color: '#8E8E93',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  eventDetails: {
    marginBottom: 32,
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventDetailContent: {
    marginLeft: 12,
    flex: 1,
  },
  eventDetailLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 2,
  },
  eventDetailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  attendeesSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  attendeesList: {
    marginBottom: 16,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  attendeeHandle: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
  schoolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  schoolText: {
    color: '#1DA1F2',
    fontSize: 12,
    marginLeft: 4,
  },
  noAttendeesText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    backgroundColor: '#000000',
  },
  rsvpButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1DA1F2',
    alignItems: 'center',
  },
  rsvpButtonActive: {
    backgroundColor: '#1DA1F2',
  },
  rsvpButtonText: {
    color: '#1DA1F2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rsvpButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#8E8E93',
    fontSize: 16,
  },
});

export default EventDetailScreen;