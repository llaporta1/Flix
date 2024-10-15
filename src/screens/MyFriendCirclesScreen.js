import React, { useState } from 'react';
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
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { auth, firestore, storage } from '../../firebase/firebaseConfigs';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Menu from '../components/Menu';

const MyFriendCirclesScreen = ({ navigateTo }) => {
  const [circleName, setCircleName] = useState('New Friend Circle');
  const [imageUrl, setimageUrl] = useState(null); // Selected image for the circle background
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);

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
        setimageUrl(source); // Set the selected image as the circle background
      }
    } catch (error) {
      console.error('Error launching image library: ', error);
    }
  };

  const uploadImageToFirebase = async (imageUri) => {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const storageRef = ref(storage, `imageUrls/${auth.currentUser.uid}_${Date.now()}`);
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

    await addDoc(collection(firestore, 'friendCircles'), {
      name: circleName,
      members: [userId, ...selectedFriends],
      imageUrl: downloadUrl,
      createdAt: serverTimestamp(),
    });

    setShowCreateModal(false);
    setCircleName('New Friend Circle');
    setimageUrl(null);
    setSelectedFriends([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>My Friend Circles</Text>

        {/* Vertical List of Options */}
        <TouchableOpacity style={styles.optionButton} onPress={() => setShowCreateModal(true)}>
          <Text style={styles.optionText}>Create a Circle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={() => navigateTo('MyCirclesScreen')}>
          <Text style={styles.optionText}>My Circles</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionButton} onPress={() => setShowInviteModal(true)}>
          <Text style={styles.optionText}>Invitations</Text>
        </TouchableOpacity>

        {/* Create Circle Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Circle Image as Background */}
              <ImageBackground
                source={imageUrl ? { uri: imageUrl } : null}
                style={styles.imageUrlBackground}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{circleName}</Text>
                  <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                    <Text style={styles.closeModal}>X</Text>
                  </TouchableOpacity>
                </View>
              </ImageBackground>

              <View style={styles.inputWithIcon}>
                <TextInput
                  placeholder="Enter Circle Name"
                  value={circleName}
                  onChangeText={setCircleName}
                  style={styles.input}
                  placeholderTextColor="#000"
                />
                {/* <Image
                  source={require('../../pen.png')}
                  style={styles.penIcon}
                /> */}
              </View>

              <TouchableOpacity style={styles.modalButton} onPress={selectImage}>
                <View style={styles.buttonWithIcon}>
                  <Text style={styles.modalButtonText}>Choose Circle Image</Text>
                  {/* <Image
                    source={require('../../images.png')}
                    style={styles.imagesIcon}
                  /> */}
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalButton} onPress={createFriendCircle}>
                <Text style={styles.modalButtonText}>Create Circle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Invite Friends Modal */}
        <Modal visible={showInviteModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Invite Friends</Text>
                <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                  <Text style={styles.closeModal}>X</Text>
                </TouchableOpacity>
              </View>
              <ScrollView>
                {/* Friends List for Invitation */}
                <Text>Friend selection functionality coming soon!</Text>
              </ScrollView>
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
    backgroundColor: '#000',
  },
  contentContainer: {
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  optionButton: {
    backgroundColor: '#AARRGGBB', // Update this to a valid color
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    borderColor: '#fff', // White border for contrast
    borderWidth: 1,
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24, // Larger text size for "New Friend Circle"
    fontWeight: 'bold', // Bold text
    color: '#000',
  },
  closeModal: {
    fontSize: 24, // Larger size for the "X" button
    color: '#000',
    fontWeight: 'bold',
    position: 'absolute',
    right: 10, // Move to the right corner
    top: 10, // Move to the top corner
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
    color: '#000',
  },
  penIcon: {
    width: 20, // Small size for the pen icon
    height: 20,
    marginLeft: 10, // Add some spacing between the input and icon
  },
  modalButton: {
    backgroundColor: '#AAARRGGBB', // Update this to a valid color
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
  buttonWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagesIcon: {
    width: 20,
    height: 20,
    marginLeft: 10,
  },
  imageUrlBackground: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MyFriendCirclesScreen;
