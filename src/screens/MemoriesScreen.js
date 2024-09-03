import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { auth, firestore } from '../../firebase/firebaseConfigs';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Menu from '../components/Menu'; // Import Menu component
import { format } from 'date-fns'; // Import date-fns for formatting dates

// Get screen dimensions for full-screen view
const { width, height } = Dimensions.get('window');

const MemoriesScreen = ({ navigateTo }) => {
  const [memories, setMemories] = useState({});
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const userId = auth.currentUser.uid;
      const postsRef = collection(firestore, 'posts');
      const q = query(postsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const memoriesData = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp?.toDate(); // Convert Firestore timestamp to JS Date
        const date = format(timestamp, 'yyyy-MM-dd'); // Format date as 'YYYY-MM-DD'

        if (!memoriesData[date]) {
          memoriesData[date] = [];
        }
        memoriesData[date].push({
          id: doc.id,
          ...data,
        });
      });

      setMemories(memoriesData);
    } catch (error) {
      console.error('Error fetching memories: ', error);
    }
  };

  const handleDayPress = (day) => {
    const selectedDateMemories = memories[day.dateString] || [];
    if (selectedDateMemories.length > 0) {
      setSelectedMemory(selectedDateMemories[0]); // Select the first memory as default
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setSelectedMemory(null);
    setModalVisible(false);
  };

  const renderDayComponent = (day) => {
    const dateString = day.dateString;
    if (memories[dateString] && memories[dateString].length > 0) {
      const firstPost = memories[dateString][0]; // Get the first (or only) post of that day
      const coverImage = firstPost.imageUris[0]; // Use the first image URI as the cover

      return (
        <TouchableOpacity onPress={() => handleDayPress(day)} style={styles.dayContainer}>
          <Image
            source={{ uri: coverImage }} // Display the cover image
            style={styles.dayImage}
          />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Add Menu component to the screen */}
      <Menu navigateTo={navigateTo} />

      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>Memories</Text>
        <Calendar
          markedDates={Object.keys(memories).reduce((acc, date) => {
            acc[date] = { marked: true, dotColor: '#50cebb' }; // Mark dates with posts
            return acc;
          }, {})}
          onDayPress={handleDayPress}
          dayComponent={({ date, state }) => (
            <View>
              {/* Display default day number */}
              <Text style={{ textAlign: 'center', color: state === 'disabled' ? 'gray' : 'white' }}>
                {date.day}
              </Text>
              {/* Render small image if there is a post on this day */}
              {renderDayComponent(date)}
            </View>
          )}
          renderArrow={(direction) => (
            <Text style={styles.arrowText}>{direction === 'left' ? '<' : '>'}</Text>
          )}
          theme={{
            backgroundColor: '#000',  // Set calendar background to black
            calendarBackground: '#000',
            textSectionTitleColor: 'gray',
            dayTextColor: 'white',
            todayTextColor: '#fff',
            arrowColor: 'white',
            monthTextColor: 'white',
            selectedDayBackgroundColor: '#333',
            selectedDayTextColor: 'white',
            textDisabledColor: '#555', // Dark gray for disabled days
            dotColor: '#fff',
          }}
        />
      </View>

      {/* Modal to display selected memory */}
      <Modal visible={isModalVisible} transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selectedMemory && selectedMemory.imageUris.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.fullImage} />
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Set background to black
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white', // Set header text to white
    marginBottom: 20,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayImage: {
    width: 30, // Adjust size for the calendar
    height: 30,
    borderRadius: 5,
    marginTop: 3, // Reduced margin for less spacing
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: width - 40,
    height: height - 80,
  },
  fullImage: {
    width: '100%',
    height: 300,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff5c5c',
    borderRadius: 20,
    padding: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  arrowText: {
    color: 'white', // Set arrow text to white
  },
});

export default MemoriesScreen;
