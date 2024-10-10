import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { auth, firestore } from '../../firebase/firebaseConfigs';
import { collection, query, where, getDocs, addDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import Menu from '../components/Menu';

const MyFriendCirclesScreen = ({ navigateTo }) => {
  const [friendCircles, setFriendCircles] = useState([]);
  const [circleName, setCircleName] = useState('');
  const [circleCode, setCircleCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);

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
    const userId = auth.currentUser.uid;
    const code = generateUniqueCode();
    await addDoc(collection(firestore, 'friendCircles'), {
      name: circleName,
      code,
      members: [userId],
      createdAt: serverTimestamp(),
    });
    Alert.alert('Success', `Circle created with code: ${code}`);
    setShowCreateModal(false);
    fetchFriendCircles();
  };

  const joinFriendCircle = async () => {
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

  const renderCircleItem = ({ item }) => (
    <View style={styles.circleItem}>
      <Image source={{ uri: item.imageUrl }} style={styles.circleImage} />
      <View style={styles.circleTextContainer}>
        <Text style={styles.circleName}>{item.name}</Text>
        <Text style={styles.circleMembers}>
          {item.members.slice(0, 2).join(', ')} + {item.members.length - 2} more
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>My Friend Circles</Text>
        
        <TouchableOpacity style={styles.optionButton} onPress={() => navigateTo('MyCircles')}>
          <Text style={styles.optionText}>My Circles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowJoinModal(true)}>
          <Text style={styles.optionText}>Join a Circle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.optionText}>Create a Circle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => navigateTo('FindCircles')}>
          <Text style={styles.optionText}>Find Circles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionButton} onPress={() => navigateTo('Invitations')}>
          <Text style={styles.optionText}>Invitations</Text>
        </TouchableOpacity>

        {/* List of Circles */}
        <FlatList
          data={friendCircles}
          renderItem={renderCircleItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.circlesList}
        />
        
        {/* Modals for Join/Create */}
        <Modal visible={showCreateModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                placeholder="Circle Name"
                value={circleName}
                onChangeText={setCircleName}
                style={styles.input}
              />
              <TouchableOpacity style={styles.modalButton} onPress={createFriendCircle}>
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showJoinModal} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                placeholder="Enter Circle Code"
                value={circleCode}
                onChangeText={setCircleCode}
                style={styles.input}
              />
              <TouchableOpacity style={styles.modalButton} onPress={joinFriendCircle}>
                <Text style={styles.modalButtonText}>Join</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowJoinModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background
  },
  contentContainer: {
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    color: '#fff', // White text
    textAlign: 'center',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#555', // Gray background
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  circlesList: {
    marginTop: 20,
  },
  circleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#333', // Dark gray
    borderRadius: 8,
    marginBottom: 10,
  },
  circleImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  circleTextContainer: {
    flex: 1,
  },
  circleName: {
    color: '#fff',
    fontSize: 18,
  },
  circleMembers: {
    color: '#aaa',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  input: {
    backgroundColor: '#444',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
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
