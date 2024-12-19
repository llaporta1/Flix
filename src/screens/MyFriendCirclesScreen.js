import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { auth, firestore, storage } from '../../firebase/firebaseConfigs';
import { addDoc, collection, serverTimestamp, getDoc, doc, getDocs, where, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { launchImageLibrary } from 'react-native-image-picker';
import Menu from '../components/Menu';

const MyFriendCirclesScreen = ({ navigateTo }) => {
  const [circleName, setCircleName] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [friendsList, setFriendsList] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    fetchFriends();
    fetchInvites();
  }, []);

  const fetchFriends = async () => {
    const userId = auth.currentUser.uid;

    try {
      const userDocRef = doc(firestore, 'users', userId);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        if (userData.friends && Array.isArray(userData.friends)) {
          const fetchedFriends = [];

          for (const friendId of userData.friends) {
            const friendDocRef = doc(firestore, 'users', friendId);
            const friendSnapshot = await getDoc(friendDocRef);

            if (friendSnapshot.exists()) {
              const friendData = friendSnapshot.data();
              fetchedFriends.push({
                id: friendSnapshot.id,
                username: friendData.username,
                profileImageUri: friendData.profileImageUri || '', // Placeholder for profile image
              });
            }
          }
          setFriendsList(fetchedFriends);
          setSearchResults(fetchedFriends);
        }
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchInvites = async () => {
    const userId = auth.currentUser.uid;

    try {
      const q = query(collection(firestore, 'circleInvites'), where('inviteeId', '==', userId));
      const querySnapshot = await getDocs(q);
      const inviteData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setInvites(inviteData);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  };

  const searchFriends = (text) => {
    setFriendSearch(text);
    if (text === '') {
      setSearchResults(friendsList); // Show all friends if search query is empty
    } else {
      const filteredFriends = friendsList.filter((friend) =>
        friend.username.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(filteredFriends);
    }
  };

  const toggleSelectFriend = (friend) => {
    if (selectedFriends.includes(friend.id)) {
      setSelectedFriends(selectedFriends.filter((id) => id !== friend.id));
    } else {
      setSelectedFriends([...selectedFriends, friend.id]);
    }
  };

  const selectImage = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
      });

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error: ', response.errorMessage);
      } else {
        const source = response.assets[0].uri;
        setImageUrl(source);
      }
    } catch (error) {
      console.error('Error launching image library: ', error);
    }
  };

  const uploadImageToFirebase = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `imageUrl/${auth.currentUser.uid}_${Date.now()}`);
      const snapshot = await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image: ', error);
      return null;
    }
  };

  const createFriendCircle = async () => {
    try {
      const userId = auth.currentUser.uid;

      // Check if a circle with the same name already exists
      const circlesRef = collection(firestore, 'friendCircles');
      const q = query(circlesRef, where('name', '==', circleName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert('Circle name already exists. Please choose a different name.');
        return;
      }

      // Upload the image (if provided) and get the download URL
      let downloadUrl = '';
      if (imageUrl) {
        downloadUrl = await uploadImageToFirebase(imageUrl);
      }

      // Create the new friend circle
      const newCircleRef = await addDoc(circlesRef, {
        name: circleName,
        members: [userId, ...selectedFriends], // Include the user and selected friends as members
        imageUrl: downloadUrl, // Store the circle's image URL
        createdAt: serverTimestamp(),
      });

      // Send invites to selected friends
      await Promise.all(
        selectedFriends.map(async (friendId) => {
          await addDoc(collection(firestore, 'circleInvites'), {
            circleId: newCircleRef.id,
            inviteeId: friendId,
            circleName: circleName,
            senderId: userId, // Current user (sender) ID
            createdAt: serverTimestamp(),
          });
        })
      );

      // Reset state after circle creation
      setShowCreateModal(false);
      setCircleName('');
      setImageUrl(null);
      setSelectedFriends([]);
      alert('Friend circle created and invites sent!');
    } catch (error) {
      console.error('Error creating circle and sending invites:', error);
      alert('Failed to create circle or send invites. Please try again.');
    }
  };

  const renderInviteItem = ({ item }) => (
    <View style={styles.inviteItem}>
      <Text style={styles.inviteText}>You've been invited to: {item.circleName}</Text>
      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => console.log(`Accepted invite to ${item.circleName}`)} // Handle accepting invite here
      >
        <Text style={styles.acceptButtonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>My Friend Circles</Text>

        {/* Create a circle button */}
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.optionText}>Create a Circle</Text>
        </TouchableOpacity>

        {/* My Circles button */}
        <TouchableOpacity style={styles.optionButton} onPress={() => navigateTo('MyCirclesScreen')}>
          <Text style={styles.optionText}>My Circles</Text>
        </TouchableOpacity>

        {/* My Invites button */}
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowInviteSection(true)}>
          <Text style={styles.optionText}>My Invites</Text>
        </TouchableOpacity>

        {/* Display invites in a modal */}
        <Modal visible={showInviteSection} animationType="slide">
          <SafeAreaView style={styles.inviteContainer}>
            {/* Back button with an arrow image */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowInviteSection(false)} // Close the invites modal
            >
              <Image source={require('../../assets/back-arrow.png')} style={styles.backArrowImage} />
            </TouchableOpacity>

            <Text style={styles.headerText}>Circle Invites</Text>
            {invites.length === 0 ? (
              <Text style={styles.noInvitesText}>No invites</Text>
            ) : (
              <FlatList
                data={invites}
                renderItem={renderInviteItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.inviteList}
              />
            )}
          </SafeAreaView>
        </Modal>

        {/* Create Circle Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent={false}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{circleName || 'New Circle'}</Text>

            {/* Circle name input */}
            <TextInput
              placeholder="Circle name"
              value={circleName}
              onChangeText={setCircleName}
              style={styles.input}
              placeholderTextColor="#aaa"
            />

            {/* Invite friends search bar */}
            <TextInput
              style={styles.searchInput}
              placeholder="Search for friends"
              placeholderTextColor="#aaa"
              value={friendSearch}
              onChangeText={searchFriends}
            />

            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => toggleSelectFriend(item)}
                  style={[
                    styles.friendItem,
                    selectedFriends.includes(item.id) && styles.selectedFriend,
                  ]}
                >
                  <Text style={styles.friendText}>{item.username}</Text>
                </TouchableOpacity>
              )}
            />

            {/* Create circle button */}
            <TouchableOpacity style={styles.modalButton} onPress={createFriendCircle}>
              <Text style={styles.modalButtonText}>Create Circle</Text>
            </TouchableOpacity>

            {/* Close modal button */}
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.closeModalText}>X</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    borderColor: '#fff',
    borderWidth: 1,
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  backArrowImage: {
    width: 30,
    height: 30,
    tintColor: '#fff',
  },
  modalContent: {
    backgroundColor: '#111',
    padding: 20,
    flex: 1,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#333',
    borderColor: '#555',
    borderWidth: 1,
    marginBottom: 20,
    color: '#fff',
  },
  searchInput: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#333',
    borderColor: '#555',
    borderWidth: 1,
    color: '#fff',
    marginBottom: 20,
  },
  friendItem: {
    padding: 10,
    backgroundColor: '#222',
    marginBottom: 5,
    borderRadius: 5,
  },
  friendText: {
    color: '#fff',
  },
  selectedFriend: {
    backgroundColor: '#007AFF',
  },
  modalButton: {
    backgroundColor: '#444',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    borderColor: '#fff',
    borderWidth: 1,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeModalButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeModalText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  inviteContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  inviteItem: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  inviteText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
  },
  acceptButton: {
    backgroundColor: '#00cc00',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  noInvitesText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default MyFriendCirclesScreen;
