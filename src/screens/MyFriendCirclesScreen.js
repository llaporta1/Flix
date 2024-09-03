import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { auth, firestore } from '../../firebase/firebaseConfigs';
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import Menu from '../components/Menu';

// Utility function to generate a random 10-character code
const generateUniqueCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const MyFriendCirclesScreen = ({ navigateTo }) => {
  const [friendCircles, setFriendCircles] = useState([]);
  const [circleName, setCircleName] = useState('');
  const [circleCode, setCircleCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [dumpTime, setDumpTime] = useState('');

  useEffect(() => {
    fetchFriendCircles();
  }, []);

  const fetchFriendCircles = async () => {
    const userId = auth.currentUser.uid;
    const circlesRef = collection(firestore, 'friendCircles');
    const q = query(circlesRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    const circles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setFriendCircles(circles);
  };

  const createFriendCircle = async () => {
    if (!circleName || !dumpTime) {
      Alert.alert('Error', 'Please provide a circle name and set a time.');
      return;
    }

    const userId = auth.currentUser.uid;
    const code = generateUniqueCode();
    const newCircleRef = await addDoc(collection(firestore, 'friendCircles'), {
      name: circleName,
      code,
      members: [userId],
      dumpTime,
      photos: [],
      createdAt: serverTimestamp(),
    });

    Alert.alert('Success', `Circle created with code: ${code}`);
    setShowCreateModal(false);
    fetchFriendCircles();
  };

  const joinFriendCircle = async () => {
    if (!circleCode) {
      Alert.alert('Error', 'Please enter a valid code.');
      return;
    }

    const circlesRef = collection(firestore, 'friendCircles');
    const q = query(circlesRef, where('code', '==', circleCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      Alert.alert('Error', 'No circle found with this code.');
      return;
    }

    const circleDoc = querySnapshot.docs[0];
    const userId = auth.currentUser.uid;
    await updateDoc(doc(firestore, 'friendCircles', circleDoc.id), {
      members: arrayUnion(userId),
    });

    Alert.alert('Success', 'You have joined the circle!');
    setShowJoinModal(false);
    fetchFriendCircles();
  };

  const scheduleDumpTime = async (circleId) => {
    if (!dumpTime) {
      Alert.alert('Error', 'Please set a time.');
      return;
    }

    await updateDoc(doc(firestore, 'friendCircles', circleId), {
      dumpTime,
    });

    Alert.alert('Success', 'Dump time scheduled!');
    fetchFriendCircles();
  };

  const renderCircleItem = ({ item }) => (
    <View style={styles.circleItem}>
      <Text style={styles.circleName}>{item.name}</Text>
      <Text style={styles.circleCode}>Code: {item.code}</Text>
      <Text style={styles.dumpTime}>Scheduled Time: {item.dumpTime}</Text>
      <TouchableOpacity
        style={styles.scheduleButton}
        onPress={() => setSelectedCircle(item)}
      >
        <Text style={styles.scheduleButtonText}>Schedule Dump Time</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />

      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>Friend Circles</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.buttonText}>Create New Circle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => setShowJoinModal(true)}
          >
            <Text style={styles.buttonText}>Join a Circle</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={friendCircles}
          renderItem={renderCircleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.circlesList}
        />

        {/* Create Circle Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Circle</Text>
              <TextInput
                placeholder="Circle Name"
                value={circleName}
                onChangeText={setCircleName}
                style={styles.input}
              />
              <TextInput
                placeholder="Schedule Time (HH:MM)"
                value={dumpTime}
                onChangeText={setDumpTime}
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={createFriendCircle}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Join Circle Modal */}
        <Modal visible={showJoinModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Join a Circle</Text>
              <TextInput
                placeholder="Enter Circle Code"
                value={circleCode}
                onChangeText={setCircleCode}
                style={styles.input}
              />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={joinFriendCircle}
              >
                <Text style={styles.modalButtonText}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowJoinModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Schedule Dump Time Modal */}
        {selectedCircle && (
          <Modal visible={true} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Schedule Dump Time</Text>
                <TextInput
                  placeholder="Set Time (HH:MM)"
                  value={dumpTime}
                  onChangeText={setDumpTime}
                  style={styles.input}
                />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    scheduleDumpTime(selectedCircle.id);
                    setSelectedCircle(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Set Time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setSelectedCircle(null)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  circlesList: {
    paddingBottom: 80,
  },
  circleItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  circleName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  circleCode: {
    color: '#6c757d',
    marginBottom: 5,
  },
  dumpTime: {
    color: '#17a2b8',
    marginBottom: 10,
  },
  scheduleButton: {
    backgroundColor: '#ffc107',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default MyFriendCirclesScreen;
