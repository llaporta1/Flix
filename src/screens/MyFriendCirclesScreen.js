import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ImageBackground,
  Image,
  ScrollView,
  FlatList,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { auth, firestore, storage } from '../../firebase/firebaseConfigs';
import { addDoc, collection, serverTimestamp, getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Menu from '../components/Menu';

const MyFriendCirclesScreen = ({ navigateTo }) => {
  const [circleName, setCircleName] = useState('');
  const [imageUrl, setImageUrl] = useState(null); 
  const [showCreateModal, setShowCreateModal] = useState(false); 
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [friendSearch, setFriendSearch] = useState(''); 
  const [friendsList, setFriendsList] = useState([]); 
  const [searchResults, setSearchResults] = useState([]); 
  const [selectedFriends, setSelectedFriends] = useState([]); // To store selected friends

  useEffect(() => {
    // Fetch user's friends list from the 'friends' field in the 'users' collection
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
          } else {
            setFriendsList([]);
            setSearchResults([]);
          }
        } else {
          console.log('User document does not exist');
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
  }, []);

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
    const userId = auth.currentUser.uid;

    let downloadUrl = '';
    if (imageUrl) {
      downloadUrl = await uploadImageToFirebase(imageUrl);
    }

    const newCircleRef = await addDoc(collection(firestore, 'friendCircles'), {
      name: circleName,
      members: [userId, ...selectedFriends], // Add selected friends' IDs to the members field
      imageUrl: downloadUrl,
      createdAt: serverTimestamp(),
    });

    setShowCreateModal(false);
    setCircleName('');
    setImageUrl(null);
    setSelectedFriends([]); // Reset selected friends
  };

  const handleFriendSearch = (text) => {
    setFriendSearch(text);
    if (text === '') {
      setSearchResults(friendsList);
    } else {
      const filteredResults = friendsList.filter(friend =>
        friend.username.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(filteredResults);
    }
  };

  // Handle friend selection
  const handleSelectFriend = (friendId, username) => {
    if (!selectedFriends.includes(friendId)) {
      setSelectedFriends(prev => [...prev, friendId]); // Add selected friend ID
    }
  };

  // Render selected friends
  const renderSelectedFriends = () => (
    <View style={styles.selectedFriendsContainer}>
      {selectedFriends.length > 0 ? (
        selectedFriends.map((friendId, index) => {
          const friend = friendsList.find(f => f.id === friendId);
          return (
            <Text key={index} style={styles.selectedFriendText}>
              {friend ? friend.username : 'Unknown'}
            </Text>
          );
        })
      ) : (
        <Text style={styles.noSelectedFriendsText}>No friends selected.</Text>
      )}
    </View>
  );

  // Render friend item similar to the one on the friends page
  const renderFriendItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleSelectFriend(item.id, item.username)} style={styles.friendItem}>
      <Image
        source={
          item.profileImageUri
            ? { uri: item.profileImageUri }
            : require('../../assets/profile-placeholder.png') // Add a default placeholder image here
        }
        style={styles.profileImage}
      />
      <Text style={styles.friendUsername}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>My Friend Circles</Text>

        <TouchableOpacity style={styles.optionButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.optionText}>Create a Circle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={() => navigateTo('MyCirclesScreen')}>
          <Text style={styles.optionText}>My Circles</Text>
        </TouchableOpacity>

        {/* Create Circle Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent={false}>
  <View style={styles.modalOverlay}>
    {/* Remove ScrollView if FlatList is handling the scrolling */}
    <View style={styles.modalContent}> 
      <ImageBackground
        source={imageUrl ? { uri: imageUrl } : null}
        style={styles.imageUrlBackground} // Enlarged image background
        imageStyle={{ borderRadius: 10 }}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{circleName || 'New Circle'}</Text>
        </View>
      </ImageBackground>

      <TextInput
        placeholder="Enter Circle Name"
        value={circleName}
        onChangeText={setCircleName}
        style={styles.input}
        placeholderTextColor="#000"
      />

      <TouchableOpacity style={styles.modalButton} onPress={selectImage}>
        <Text style={styles.modalButtonText}>Choose Circle Image (Optional)</Text>
      </TouchableOpacity>

      {/* Render selected friends */}
      {renderSelectedFriends()}

      {/* Invite Friends Button */}
      <TouchableOpacity 
        style={styles.modalButton} 
        onPress={() => setShowInviteSection(!showInviteSection)} // Toggle invite section
      >
        <Text style={styles.modalButtonText}>Invite Friends</Text>
      </TouchableOpacity>

      {/* Expanded Section to Invite Friends */}
      {showInviteSection && (
        <View style={styles.inviteSection}>
          {/* Search Bar for Inviting Friends */}
          <View style={styles.searchContainer}>
            <TextInput
              placeholder="Search for friends..."
              value={friendSearch}
              onChangeText={handleFriendSearch}
              style={[styles.input, { flex: 1 }]}
              placeholderTextColor="#000"
            />
            <Image
              source={require('../../assets/search.png')}
              style={styles.searchIcon}
            />
          </View>

          {/* Friends Search Results */}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={renderFriendItem}
            ListEmptyComponent={() => (
              <Text style={styles.noResultsText}>No friends found.</Text>
            )}
          />
        </View>
      )}

      <TouchableOpacity style={styles.modalButton} onPress={createFriendCircle}>
        <Text style={styles.modalButtonText}>Create Circle</Text>
      </TouchableOpacity>
    </View>

    <TouchableOpacity
      style={styles.closeModalOutside}
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
    textAlign: 'center',
    marginBottom: 10, // Reduced margin to decrease space
  },
  optionButton: {
    backgroundColor: '#333',
    padding: 10, // Reduced padding to decrease space
    borderRadius: 8,
    marginVertical: 5, // Reduced margin between buttons
    borderColor: '#fff',
    borderWidth: 1,
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '100%',
    paddingBottom: 40, // Ensure space at the bottom for scrolling
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  closeModalOutside: {
    position: 'absolute',
    top: 0,
    right: 20,
  },
  closeModalText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    color: '#000',
  },
  modalButton: {
    backgroundColor: '#333',
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
  imageUrlBackground: {
    width: '100%',
    height: '30%', // Adjusted height for background
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteSection: {
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  searchIcon: {
    width: 20,
    height: 20,
    tintColor: '#000',
    marginLeft: 10,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  friendUsername: {
    color: '#fff',
    fontSize: 16,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 10,
    color: '#555',
  },
  selectedFriendsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  selectedFriendText: {
    color: '#000',
    backgroundColor: '#ddd',
    padding: 5,
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5,
  },
  noSelectedFriendsText: {
    color: '#555',
  },
});

export default MyFriendCirclesScreen;
