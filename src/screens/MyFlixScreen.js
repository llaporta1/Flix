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
import { getDoc, doc, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const MyFlixScreen = ({ navigateTo }) => {
  const [caption, setCaption] = useState('');
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Track the current image index
  const [friendCircles, setFriendCircles] = useState([]); // To store friend circles
  const [visibilityOption, setVisibilityOption] = useState('everyone'); // Default visibility option
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown visibility toggle
  const captionInputRef = useRef(null); // Reference for the caption input

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
        const newPost = {
          userId: user.uid,
          username: username,
          imageUris: selectedImages, // Save array of image URIs
          caption: caption,
          timestamp: new Date(),
          visibilityId: visibilityOption, // Save the selected visibility option
        };

        await addDoc(collection(firestore, 'posts'), newPost);
        setCaption('');
        setSelectedImages([]);
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

  const selectImages = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
        selectionLimit: 10, // Allow selecting up to 10 images
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

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleVisibilitySelect = (option) => {
    setVisibilityOption(option);
    setIsDropdownOpen(false); // Close dropdown after selection
  };

  // Function to handle next image
  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % selectedImages.length);
  };

  // Function to handle previous image
  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex - 1 + selectedImages.length) % selectedImages.length);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigateTo('Home')}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My Flix</Text>

      {/* Caption input with clickable pen icon inside */}
      <View style={styles.captionContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter caption"
          placeholderTextColor="#888"
          value={caption}
          onChangeText={setCaption}
          ref={captionInputRef} // Attach reference to caption input
        />
        <TouchableOpacity onPress={handlePenPress}>
          <Image source={require('../../assets/pen.png')} style={styles.iconInsideTextBox} />
        </TouchableOpacity>
      </View>

      {/* Select Images button with larger, thicker image icon */}
      <TouchableOpacity onPress={selectImages} style={styles.button}>
        <Text style={styles.buttonText}>Select Images</Text>
        <Image source={require('../../assets/image.png')} style={styles.largeImageIcon} />
      </TouchableOpacity>

      {/* Add the visibility dropdown */}
      <TouchableOpacity style={styles.visibilityDropdownContainer} onPress={toggleDropdown}>
        <Text style={styles.visibilityText}>
          Post to: {visibilityOption === 'everyone'
            ? 'Everyone'
            : friendCircles.find(circle => circle.id === visibilityOption)?.name || 'Select'}
        </Text>
        <Image
          source={require('../../assets/down-arrow.png')} // Rotate this 45 degrees
          style={[styles.dropdownArrow, { transform: [{ rotate: isDropdownOpen ? '45deg' : '0deg' }] }]}
        />
      </TouchableOpacity>

      {/* Dropdown options (shown only if the dropdown is open) */}
      {isDropdownOpen && (
        <View style={styles.visibilityOptions}>
          <TouchableOpacity
            onPress={() => handleVisibilitySelect('everyone')}
            style={styles.visibilityOption}
          >
            <Text style={styles.visibilityOptionText}>Everyone</Text>
          </TouchableOpacity>
          {friendCircles.map(circle => (
            <TouchableOpacity
              key={circle.id}
              onPress={() => handleVisibilitySelect(circle.id)}
              style={styles.visibilityOption}
            >
              <Text style={styles.visibilityOptionText}>{circle.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Preview the post in the same format as the feed */}
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
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  visibilityDropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    padding: 12,
    borderRadius: 5,
    width: '80%',
    marginBottom: 20,
  },
  visibilityText: {
    color: '#fff',
    fontSize: 16,
  },
  dropdownArrow: {
    width: 15,
    height: 15,
    tintColor: '#fff',
  },
  visibilityOptions: {
    position: 'absolute',
    top: 215,
    width: '80%',
    backgroundColor: '#333',
    zIndex: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  visibilityOption: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  visibilityOptionText: {
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
    width: '100%', // Keep the preview container the same width as the buttons
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
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
    maxHeight: 175,
  },
  postImage: {
    width: width - 100, // Adjusted to make the preview smaller
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
