import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import { getDoc, doc, setDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const MyFlixScreen = ({ navigateTo }) => {
  const [caption, setCaption] = useState('');
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Track the current image index
  const [friendCircles, setFriendCircles] = useState([]); // To store friend circles
  const [selectedCircles, setSelectedCircles] = useState([]); // Selected friend circles
  const [isDropdownVisible, setIsDropdownVisible] = useState(false); // Dropdown visibility
  const captionInputRef = useRef(null); // Reference for the caption input
  const [profileImageUri, setProfileImageUri] = useState('');  // Store user's profile image URI


  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile: ', err);
        setError('Failed to fetch user profile');
      }
    };

    const fetchFriendCircles = async () => {
      try {
        const userId = auth.currentUser.uid;
        const circlesRef = collection(firestore, 'friendCircles');
        const q = query(circlesRef, where('members', 'array-contains', userId));
        const querySnapshot = await getDocs(q);
        const circles = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFriendCircles(circles);
      } catch (error) {
        console.error('Error fetching friend circles:', error);
        setError('Failed to fetch friend circles');
      }
    };

    fetchUserProfile();
    fetchFriendCircles();
  }, []);

  const handleCreatePost = async () => {
    if (selectedImages.length === 0) {
      setError('Please select at least one image');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        // Determine the visibility array
        const visibilityId = selectedCircles.length === 0 || selectedCircles.includes('everyone')
          ? ['everyone']
          : selectedCircles;

        const newPost = {
          userId: user.uid,
          username: username,
          imageUris: selectedImages,
          caption: caption,
          timestamp: new Date(),
          visibilityId: visibilityId, // Array of friend circle IDs or 'everyone'
        };

        // Add the post to the global 'posts' collection and get the generated post ID
        const globalPostRef = await addDoc(collection(firestore, 'posts'), newPost);
        const postId = globalPostRef.id; // This is the unique ID for the post

        if (selectedCircles.length !== 0 && !selectedCircles.includes('everyone')) {
          // Post to each selected friend circle's subcollection of posts
          await Promise.all(
            selectedCircles.map(async (circleId) => {
              // Use the same postId for posts in friendCircles/{circleId}/posts
              await setDoc(doc(firestore, `friendCircles/${circleId}/posts`, postId), newPost);
            })
          );
        }

        // Initialize an empty reactions subcollection for the post
        const reactionsRef = collection(firestore, `posts/${postId}/reactions`);
        await addDoc(reactionsRef, {}); // Empty document just to initialize the collection

        // Reset form after post creation
        setCaption('');
        setSelectedImages([]);
        setSelectedCircles([]);
        setError(null);
        Alert.alert('Success', 'Post created successfully!');
      } else {
        setError('User not authenticated');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    }
  };

  // Function to add a reaction to a post's reactions subcollection
  const handleAddReaction = async (postId, reaction) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Reference to the reactions subcollection of the specific post
      const reactionRef = doc(collection(firestore, `posts/${postId}/reactions`));

      // Add the reaction document with userId and the reaction content
      await setDoc(reactionRef, {
        userId: user.uid,
        reaction: reaction,
        timestamp: new Date(),
      });

      Alert.alert('Success', 'Reaction added!');
    } catch (error) {
      console.error('Error adding reaction: ', error);
      Alert.alert('Error', 'Failed to add reaction');
    }
  };

  const selectImages = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        selectionLimit: 10,
      });

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error: ', response.errorMessage);
        setError('Failed to pick images');
      } else {
        const selectedUris = response.assets.map((asset) => asset.uri);
        setSelectedImages(selectedUris);
      }
    } catch (error) {
      console.error('Error launching image library: ', error);
      setError('Error launching image library');
    }
  };

  const handlePenPress = () => {
    if (captionInputRef.current) {
      captionInputRef.current.focus();
    }
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  // Handle selecting/deselecting "Everyone" or specific friend circles
  const toggleSelectCircle = (circleId) => {
    if (circleId === 'everyone') {
      // Deselect all circles if "Everyone" is selected
      if (selectedCircles.includes('everyone')) {
        setSelectedCircles([]); // Unselect "Everyone" if already selected
      } else {
        setSelectedCircles(['everyone']); // Select "Everyone" and clear other selections
      }
    } else {
      if (selectedCircles.includes('everyone')) {
        setSelectedCircles([]); // Unselect "Everyone" first
      }
      if (selectedCircles.includes(circleId)) {
        setSelectedCircles((prev) => prev.filter((id) => id !== circleId)); // Unselect circle
      } else {
        setSelectedCircles((prev) => [...prev, circleId]); // Select circle
      }
    }
  };

  // Function to handle moving to the next image
  const handleNextImage = () => {
    if (currentImageIndex < selectedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  // Function to handle moving to the previous image
  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigateTo('Home')}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My Flix</Text>

      <View style={styles.captionContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter caption"
          placeholderTextColor="#888"
          value={caption}
          onChangeText={setCaption}
          ref={captionInputRef}
        />
        <TouchableOpacity onPress={handlePenPress}>
          <Image source={require('../../assets/pen.png')} style={styles.iconInsideTextBox} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={selectImages} style={styles.button}>
        <Text style={styles.buttonText}>Select Images</Text>
        <Image source={require('../../assets/image.png')} style={styles.largeImageIcon} />
      </TouchableOpacity>

      {/* Post to dropdown */}
      <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
        <Text style={styles.dropdownButtonText}>Post to</Text>
        <Image
          source={require('../../assets/down-arrow.png')}
          style={styles.dropdownIcon}
        />
      </TouchableOpacity>

      {isDropdownVisible && (
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            key="everyone"
            style={styles.checkboxContainer}
            onPress={() => toggleSelectCircle('everyone')}
          >
            <View
              style={[
                styles.checkbox,
                selectedCircles.includes('everyone') && styles.checkboxChecked,
              ]}
            >
              {selectedCircles.includes('everyone') && <Text style={styles.checkboxCheckmark}>✔</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Everyone</Text>
          </TouchableOpacity>

          {friendCircles.map((circle) => (
            <TouchableOpacity
              key={circle.id}
              style={styles.checkboxContainer}
              onPress={() => toggleSelectCircle(circle.id)}
            >
              <View
                style={[
                  styles.checkbox,
                  selectedCircles.includes(circle.id) && styles.checkboxChecked,
                ]}
              >
                {selectedCircles.includes(circle.id) && <Text style={styles.checkboxCheckmark}>✔</Text>}
              </View>
              <Text style={styles.checkboxLabel}>{circle.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {selectedImages.length > 0 && (
        <View style={styles.postPreviewContainer}>
          <View style={styles.postContainer}>
            <View style={styles.userInfo}>
              <Image
                source={require('../../assets/profile-placeholder.png')}
                style={styles.profileImage}
              />
              <Text style={styles.username}>{username || 'Unknown User'}</Text>
            </View>
            <View style={styles.imageContainer}>
              {selectedImages.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <TouchableOpacity style={styles.arrowLeft} onPress={handlePrevImage}>
                      <Text style={styles.arrowText}>‹</Text>
                    </TouchableOpacity>
                  )}
                  {currentImageIndex < selectedImages.length - 1 && (
                    <TouchableOpacity style={styles.arrowRight} onPress={handleNextImage}>
                      <Text style={styles.arrowText}>›</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              <Image
                source={{ uri: selectedImages[currentImageIndex] }}
                style={styles.postImage}
                resizeMode="cover"
              />
            </View>
            {caption ? <Text style={styles.caption}>{caption}</Text> : null}
          </View>
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity onPress={handleCreatePost} style={styles.button}>
        <Text style={styles.buttonText}>Share</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    paddingTop: 50,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#fff',
    backgroundColor: '#000',
  },
  input: {
    flex: 1,
    padding: 12,
    color: '#fff',
  },
  iconInsideTextBox: {
    width: 15,
    height: 15,
    marginRight: 10,
    tintColor: '#fff',
  },
  largeImageIcon: {
    width: 30,
    height: 30,
    marginLeft: 10,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 8,
    width: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    marginBottom: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
  },
  dropdownButton: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    marginBottom: 10,
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    marginLeft: 10,
    tintColor: '#fff',
  },
  dropdownContainer: {
    width: '80%',
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#fff',
  },
  checkboxCheckmark: {
    color: '#000',
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 16,
  },
  postPreviewContainer: {
    width: '80%',
    maxHeight: 300,
  },
  postContainer: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    maxHeight: 300,
    marginBottom: 30,
    elevation: 2,
    width: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ccc',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
    maxHeight: 175,
  },
  postImage: {
    width: width - 100,
    height: width * 0.48,
    borderRadius: 10,
  },
  arrowLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -15 }],
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  arrowRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -15 }],
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  arrowText: {
    color: '#000',
    fontSize: 24,
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    marginTop: 10,
  },
  errorText: {
    color: '#ff4d4d',
    fontSize: 16,
    marginBottom: 20,
  },
});

export default MyFlixScreen;
