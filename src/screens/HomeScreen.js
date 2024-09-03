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
  ScrollView,
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
  updateDoc,
  increment,
} from 'firebase/firestore';
import Menu from '../components/Menu';

const HomeScreen = ({ navigateTo }) => {
  const [posts, setPosts] = useState([]);
  const [reactions, setReactions] = useState({});
  const [error, setError] = useState(null);
  const [userHasValidPost, setUserHasValidPost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileImages, setProfileImages] = useState({}); // State to hold profile images
  const [currentImageIndex, setCurrentImageIndex] = useState({}); // State to hold current image index for each post

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkUserPostValidity(user);
      } else {
        setError('User not authenticated');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkUserPostValidity = async (user) => {
    try {
      const now = new Date();
      const postsRef = collection(firestore, 'posts');
      const userPostsQuery = query(
        postsRef,
        where('userId', '==', user.uid),
        where('timestamp', '>=', new Date(now - 24 * 60 * 60 * 1000))
      );

      const unsubscribe = onSnapshot(userPostsQuery, (querySnapshot) => {
        if (!querySnapshot.empty) {
          setUserHasValidPost(true);
          fetchFriendsPosts(user);
        } else {
          setUserHasValidPost(false);
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error checking user post validity: ', err);
      setError('Failed to check user post validity');
      setLoading(false);
    }
  };

  const fetchFriendsPosts = async (user) => {
    try {
      const now = new Date();
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const friendsList = userDoc.data().friends || [];
        const allUserIds = [user.uid, ...friendsList];

        const postsRef = collection(firestore, 'posts');
        const postsQuery = query(
          postsRef,
          where('userId', 'in', allUserIds),
          where('timestamp', '>=', new Date(now - 24 * 60 * 60 * 1000))
        );

        const unsubscribe = onSnapshot(postsQuery, async (querySnapshot) => {
          const postsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setPosts(postsData);

          // Fetch profile images for each user
          const userIds = new Set(postsData.map((post) => post.userId));
          const profileImagePromises = Array.from(userIds).map(fetchUserProfileImage);
          await Promise.all(profileImagePromises);

          setLoading(false);
        });

        return () => unsubscribe();
      } else {
        setError('User document does not exist');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching friends posts: ', err);
      setError('Failed to fetch friends posts');
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
      // Update local state
      setReactions((prevReactions) => {
        const postReactions = prevReactions[postId] || {};
        const currentCount = postReactions[reaction] || 0;
        return {
          ...prevReactions,
          [postId]: {
            ...postReactions,
            [reaction]: currentCount + 1,
          },
        };
      });

      // Update Firestore
      const postDocRef = doc(firestore, 'posts', postId);
      await updateDoc(postDocRef, {
        [`reactions.${reaction}`]: increment(1),
      });
    } catch (error) {
      console.error('Error updating reaction: ', error);
      Alert.alert('Error', 'Failed to update reaction');
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
    const currentIndex = currentImageIndex[postId] || 0; // Default to the first image

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
      {item.caption ? (
        <Text style={styles.caption}>{item.caption}</Text>
      ) : null}
      {renderReactions(item.id, item.reactions || {})}
    </View>
  );

  const handleMyFlixPress = () => {
    navigateTo('MyFlix');
  };

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
        <Text style={styles.headerText}></Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {!userHasValidPost ? (
          <View style={styles.noPostContainer}>
            <Text style={styles.noPostText}>
              Share your flix to see your friends' posts!
            </Text>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleMyFlixPress}
            >
              <Text style={styles.shareButtonText}>Share Now</Text>
            </TouchableOpacity>
          </View>
        ) : posts.length > 0 ? (
          <FlatList
            data={posts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.postsList}
          />
        ) : (
          <Text style={styles.noPostsText}>
            No posts available. Encourage your friends to share!
          </Text>
        )}
        <TouchableOpacity
          style={styles.myFlixButton}
          onPress={handleMyFlixPress}
        >
          <Image
            source={require('../../assets/my-flix.png')}
            style={styles.myFlixIcon}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Changed to black background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Black background for loading screen
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    alignSelf: 'center',
    color: '#fff', // Set text color to white
  },
  errorText: {
    color: '#ff4d4d', // Light red for errors
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
    color: '#fff', // Set text color to white
    textAlign: 'center',
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#fff', // White button with black text
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  shareButtonText: {
    color: '#000', // Black text
    fontSize: 16,
  },
  postsList: {
    paddingBottom: 80,
  },
  postContainer: {
    backgroundColor: '#333', // Dark background for posts
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
    backgroundColor: '#ccc', // Keep profile image background as is
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff', // Set text color to white
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // White arrows with transparency
    borderRadius: 20,
    padding: 10,
  },
  arrowRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -15 }],
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // White arrows with transparency
    borderRadius: 20,
    padding: 10,
  },
  arrowText: {
    color: '#000', // Black text for arrows
    fontSize: 24,
  },
  caption: {
    fontSize: 14,
    color: '#fff', // Set caption text to white
    marginBottom: 10,
  },
  reactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionButton: {
    backgroundColor: '#444', // Darker background for reactions
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  reactionText: {
    fontSize: 14,
    color: '#fff', // White text for reactions
  },
  addReactionButton: {
    backgroundColor: '#555', // Darker background for add reaction
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  addReactionText: {
    fontSize: 14,
    color: '#fff', // White text for add reaction
  },
  noPostsText: {
    fontSize: 16,
    color: '#fff', // Set no posts text to white
    textAlign: 'center',
    marginTop: 50,
  },
  myFlixButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#fff', // White button
    borderRadius: 30,
    padding: 15,
    elevation: 5,
  },
  myFlixIcon: {
    width: 30,
    height: 30,
    tintColor: '#000', // Black icon
  },
});

export default HomeScreen;
