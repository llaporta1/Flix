import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';

const MyFlixExistingScreen = ({ route, navigateTo }) => {
  const [profileImages, setProfileImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const post = route?.params?.post;

  useEffect(() => {
    if (post) {
      fetchPostDetails(post.userId);
    }
  }, [post]);

  const fetchPostDetails = async (userId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Fetch user profile image
      fetchUserProfileImage(userId);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching post details: ', error);
      setLoading(false);
    }
  };

  const fetchUserProfileImage = async (userId) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileImages((prevState) => ({
          ...prevState,
          [userId]: userData.profileImageUri || null,
        }));
      }
    } catch (error) {
      console.error('Error fetching user profile image: ', error);
    }
  };

  const handleDeletePost = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete your post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'posts', post.id));
              Alert.alert('Post Deleted', 'Your post has been successfully deleted.');
              navigateTo('MyFlix'); // Navigate back to the post creation screen
            } catch (error) {
              console.error('Error deleting post: ', error);
              Alert.alert('Error', 'Failed to delete the post. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderImages = (images) => {
    const handleNextImage = () => {
      setCurrentImageIndex((currentImageIndex + 1) % images.length);
    };

    const handlePrevImage = () => {
      setCurrentImageIndex(
        (currentImageIndex - 1 + images.length) % images.length
      );
    };

    return (
      <View style={styles.imageContainer}>
        {images.length > 1 && (
          <>
            {currentImageIndex > 0 && (
              <TouchableOpacity style={styles.arrowLeft} onPress={handlePrevImage}>
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
            )}
            {currentImageIndex < images.length - 1 && (
              <TouchableOpacity style={styles.arrowRight} onPress={handleNextImage}>
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <Image
          source={{ uri: images[currentImageIndex] }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const now = new Date();
  const postTime = post?.timestamp?.toDate();
  const timeDifference = postTime ? (now - postTime) / (1000 * 60 * 60) : 0; // Difference in hours
  const hoursLeft = 24 - timeDifference;

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigateTo('Home')}
        activeOpacity={0.7}
      >
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>

      {post ? (
        <View style={styles.inner}>
          {renderImages(post.imageUris || [post.imageUri])}

          {/* Container with profile image, username, and caption, aligned to the left */}
          <View style={styles.userInfoRow}>
            <Image
              source={
                profileImages[post.userId]
                  ? { uri: profileImages[post.userId] } // Load the actual profile image
                  : require('../../assets/profile-placeholder.png') // Fallback to placeholder
              }
              style={styles.profileImage}
            />
            <Text style={styles.username}>{post.username || 'Unknown User'}</Text>
            {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
          </View>

          <Text style={styles.timeLeftText}>
            You can post again in {hoursLeft.toFixed(1)} hours
          </Text>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost}>
            <Text style={styles.deleteButtonText}>Delete Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.errorText}>No post found.</Text>
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    zIndex: 2,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  inner: {
    alignItems: 'center',
    paddingTop: 40,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
    marginBottom: 10,
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ccc',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 10,
  },
  postImage: {
    width: width - 32,
    height: width * 0.8,
    borderRadius: 10,
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    flexShrink: 1,
  },
  timeLeftText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
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
  deleteButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 20,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});

export default MyFlixExistingScreen;
