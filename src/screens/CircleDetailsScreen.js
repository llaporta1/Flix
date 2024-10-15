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
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  increment,
  updateDoc,
} from 'firebase/firestore';
import Menu from '../components/Menu';
import addIcon from '../../assets/add.png'; // Add icon for sharing

const CircleDetailsScreen = ({ route, navigateTo }) => {
  const { circleId } = route.params || {};
  const [circleDetails, setCircleDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reactions, setReactions] = useState({});
  const [loading, setLoading] = useState(true);
  const [userHasValidPost, setUserHasValidPost] = useState(false);
  const [profileImages, setProfileImages] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  useEffect(() => {
    if (circleId) {
      fetchCircleDetails();
      fetchCirclePosts();
    }
  }, [circleId]);

  const fetchCircleDetails = async () => {
    try {
      const circleDoc = await getDoc(doc(firestore, 'friendCircles', circleId));
      if (circleDoc.exists()) {
        setCircleDetails(circleDoc.data());
      }
    } catch (error) {
      console.error('Error fetching circle details:', error);
    }
  };

  const fetchCirclePosts = async () => {
    const now = new Date();
    try {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          const postsRef = collection(firestore, 'posts');
          // Fetch all posts from the last 24 hours without filtering by circleId
          const postsQuery = query(
            postsRef,
            where('timestamp', '>=', new Date(now - 24 * 60 * 60 * 1000)) // Fetch recent posts
          );
  
          const unsubscribePosts = onSnapshot(postsQuery, async (querySnapshot) => {
            const allPosts = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
  
            // Filter posts to only include those belonging to the current circle
            const circlePosts = allPosts.filter((post) => post.circleId === circleId);
  
            setPosts(circlePosts);
  
            // Fetch user profile images
            const userIds = new Set(circlePosts.map((post) => post.userId));
            const profileImagePromises = Array.from(userIds).map(fetchUserProfileImage);
            await Promise.all(profileImagePromises);
  
            setLoading(false);
          });
  
          return () => unsubscribePosts();
        }
      });
      return () => unsubscribe();
    } catch (err) {
      console.error('Error fetching circle posts: ', err);
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
    </View>
  );

  if (loading || !circleDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#fff" />
      </SafeAreaView>
    );
  }

  const { name, imageUrl, members } = circleDetails;

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigateTo('MyCirclesScreen')}
      >
        <Image
          source={require('../../assets/back-arrow.png')}
          style={styles.backArrowImage}
        />
      </TouchableOpacity>

      {/* Circle Top Section */}
      <ImageBackground
        source={{ uri: imageUrl || 'https://via.placeholder.com/300' }}
        style={styles.circleHeader}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <Text style={styles.circleTitle}>{name}</Text>
        </View>
      </ImageBackground>

      {/* Members Section */}
      <ScrollView contentContainerStyle={styles.membersSection}>
        {members.slice(0, 7).map((memberId, index) => (
          <Image
            key={index}
            source={require('../../assets/profile-placeholder.png')} // Placeholder
            style={styles.memberIcon}
          />
        ))}
        {members.length > 7 && (
          <Text style={styles.moreMembersText}>+ {members.length - 7} others</Text>
        )}
      </ScrollView>

      {/* Posts Section */}
      {!userHasValidPost ? (
        <View style={styles.noPostContainer}>
          <Text style={styles.noPostText}>
            Share your flix to see your friends' posts!
          </Text>
        </View>
      ) : posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.postsList}
        />
      ) : (
        <Text style={styles.noPostsText}>No posts available. Encourage your friends to share!</Text>
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backArrow: {
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
  circleHeader: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  membersSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  memberIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 10,
  },
  moreMembersText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
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
  postsList: {
    paddingBottom: 80,
  },
  postContainer: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
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
  caption: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 10,
  },
  noPostsText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default CircleDetailsScreen;
