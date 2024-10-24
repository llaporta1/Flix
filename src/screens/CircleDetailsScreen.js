import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  increment,
} from 'firebase/firestore';
import Menu from '../components/Menu';
import NavigationBar from '../components/NavigationBar'; // Import the navigation bar

const CircleDetailsScreen = ({ route, navigateTo }) => {
  const [posts, setPosts] = useState([]);
  const [reactions, setReactions] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImages, setProfileImages] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const { circleId } = route?.params; // Destructure circleName from route.params
  const [circleName, setCircleName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchCircleName(circleId);  // Fetch the circle name
        fetchCirclePosts(user, circleId); // Fetch the circle posts
      } else {
        setError('User not authenticated');
        setLoading(false);
      }
    });
  
    return () => unsubscribe();
  }, [circleId]);
  
  const fetchCircleName = async (circleId) => {
    try {
      const circleDoc = await getDoc(doc(firestore, 'friendCircles', circleId)); // Fetch circle name from Firestore
      if (circleDoc.exists()) {
        setCircleName(circleDoc.data().name); // Set the circle name
      } else {
        console.error('Circle not found');
        setCircleName('Circle Details'); // Fallback if circle not found
      }
    } catch (err) {
      console.error('Error fetching circle name: ', err);
      setCircleName('Circle Details'); // Fallback on error
    }
  };

  const fetchCirclePosts = async (user, circleId) => {
    try {
      const postsRef = collection(firestore, 'posts'); // Fetch from the global posts collection
      const postsQuery = query(postsRef, where('visibilityId', 'array-contains-any', [circleId, 'everyone'])); // Include posts visible to 'everyone' or the specific circle
  
      const unsubscribe = onSnapshot(postsQuery, async (querySnapshot) => {
        const postsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        setPosts(postsData);
  
        // Fetch profile images for users who have posted
        const userIds = new Set(postsData.map((post) => post.userId));
        const profileImagePromises = Array.from(userIds).map(fetchUserProfileImage);
        await Promise.all(profileImagePromises);
  
        setLoading(false);
      });
  
      return () => unsubscribe();
    } catch (err) {
      console.error('Error fetching circle posts: ', err);
      setError('Failed to fetch posts from this circle');
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

  const handleReaction = async (postId, reaction) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
  
      // Create a reference to the reactions subcollection for the specific post
      const reactionRef = collection(firestore, `posts/${postId}/reactions`);
  
      // Add a new reaction document to the reactions subcollection with userId and reaction fields
      await addDoc(reactionRef, {
        userId: user.uid,     // Reactor's userId
        reaction: reaction.trim(),  // Reaction emoji or message
        timestamp: new Date(),  // Timestamp when the reaction was added
      });
  
      Alert.alert('Success', 'Reaction added!');
    } catch (error) {
      console.error('Error adding reaction: ', error);
      Alert.alert('Error', 'Failed to add reaction');
    }
  };  

  const handleAddReaction = (postId) => {
    Alert.prompt(
      'Add a Reaction',
      'Enter an emoji to react with',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add',
          onPress: (reaction) => {
            if (reaction) handleReaction(postId, reaction.trim());
          },
        },
      ],
      'plain-text'
    );
  };

  const renderReactions = (postId, postReactions) => {
    const combinedReactions = {
      ...postReactions,
      ...reactions[postId],
    };

    return (
      <View style={styles.reactionContainer}>
        {Object.entries(combinedReactions).map(([emoji, count]) => (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionButton}
            onPress={() => handleReaction(postId, emoji)}
          >
            <Text style={styles.reactionText}>
              {emoji} {count}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addReactionButton}
          onPress={() => handleAddReaction(postId)}
        >
          <Text style={styles.addReactionText}>➕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderImages = (images, postId) => {
    const currentIndex = currentImageIndex[postId] || 0;

    if (!images || images.length === 0) return null;

    const handleNextImage = () => {
      setCurrentImageIndex((prevState) => ({
        ...prevState,
        [postId]: (currentIndex + 1) % images.length,
      }));
    };

    const handlePrevImage = () => {
      setCurrentImageIndex((prevState) => ({
        ...prevState,
        [postId]: (currentIndex - 1 + images.length) % images.length,
      }));
    };

    return (
      <View style={styles.imageContainer}>
        {images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity style={styles.arrowLeft} onPress={handlePrevImage}>
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity style={styles.arrowRight} onPress={handleNextImage}>
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            )}
          </>
        )}
        <Image
          source={{ uri: images[currentIndex] }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.userInfo}>
        <Image
          source={
            profileImages[item.userId]
              ? { uri: profileImages[item.userId] }
              : require('../../assets/profile-placeholder.png')
          }
          style={styles.profileImage}
        />
        <Text style={styles.username}>{item.username || 'Unknown User'}</Text>
      </View>
      {renderImages(item.imageUris || [item.imageUri], item.id)}
      {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
      {renderReactions(item.id, item.reactions || {})}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>{circleName}</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {posts.length > 0 ? (
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.postsList}
          />
        ) : (
          <View style={styles.noPostContainer}>
            <Text style={styles.noPostText}>
              Share your flix to see your friends' posts!
            </Text>
          </View>
        )}
      </View>
      <NavigationBar navigateTo={navigateTo} />
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 80,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'center',
    color: '#fff',
  },
  errorText: {
    color: '#ff4d4d',
    textAlign: 'center',
    marginVertical: 10,
  },
  noPostContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noPostText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  postContainer: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
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
  },
  postImage: {
    width: width - 32,
    height: width * 0.8,
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
    marginBottom: 10,
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionButton: {
    backgroundColor: '#444',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  reactionText: {
    fontSize: 14,
    color: '#fff',
  },
  addReactionButton: {
    backgroundColor: '#555',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  addReactionText: {
    fontSize: 14,
    color: '#fff',
  },
  postsList: {
    paddingBottom: 80,
  },
});

export default CircleDetailsScreen;
