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
  TextInput,
  Alert,
} from 'react-native';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  getDocs,
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
  const [friendsList, setFriendsList] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (circleId) {
      fetchCircleDetails();
      fetchCirclePosts();
      fetchFriendsList();
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

  const fetchFriendsList = async () => {
    try {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      const friends = userDoc.data().friends || [];

      const friendsDetails = await Promise.all(
        friends.map(async (friendId) => {
          const friendDocRef = doc(firestore, 'users', friendId);
          const friendDoc = await getDoc(friendDocRef);
          return {
            id: friendDoc.id,
            username: friendDoc.data().username,
            profileImageUri: friendDoc.data().profileImageUri || '',
          };
        })
      );

      setFriendsList(friendsDetails);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const sendCircleInvite = async (friendId) => {
    try {
      const senderId = auth.currentUser.uid;

      const circleInvitesRef = collection(firestore, 'circleInvites');
      await addDoc(circleInvitesRef, {
        senderId,
        receiverId: friendId,
        circleId,
        status: 'pending',
        timestamp: Date.now(),
      });

      Alert.alert('Circle invite sent!', `An invite has been sent to your friend.`);
    } catch (error) {
      console.error('Error sending circle invite: ', error);
      Alert.alert('Error', 'Failed to send circle invite.');
    }
  };

  const handleSelectFriend = (friendId, username) => {
    if (!selectedFriends.includes(friendId)) {
      setSelectedFriends([...selectedFriends, friendId]);
      sendCircleInvite(friendId); // Send the invite immediately after selection
    } else {
      Alert.alert(`${username} has already been invited.`);
    }
  };

  const handleSearchFriends = () => {
    if (searchQuery) {
      const results = friendsList.filter((friend) =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const renderFriendItem = ({ item }) => {
    const isSelected = selectedFriends.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.selectedFriend]}
        onPress={() => handleSelectFriend(item.id, item.username)}
      >
        <Image
          source={
            item.profileImageUri
              ? { uri: item.profileImageUri }
              : require('../../assets/profile-placeholder.png')
          }
          style={styles.friendProfileImage}
        />
        <Text style={styles.friendUsername}>{item.username}</Text>
        {isSelected && <Text style={styles.invitedText}>Invited</Text>}
      </TouchableOpacity>
    );
  };

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

      {/* Search and Invite Section */}
      <View style={styles.inviteSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for friends to invite..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchFriends}
        />
        <FlatList
          data={searchResults.length > 0 ? searchResults : friendsList}
          keyExtractor={(item) => item.id}
          renderItem={renderFriendItem}
          contentContainerStyle={styles.friendsList}
        />
      </View>

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
  inviteSection: {
    padding: 10,
    backgroundColor: '#222',
    borderRadius: 8,
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    color: '#fff',
    padding: 10,
    marginBottom: 10,
  },
  friendsList: {
    paddingBottom: 50,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  friendProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  friendUsername: {
    color: '#fff',
    fontSize: 16,
  },
  invitedText: {
    color: '#00f',
    fontSize: 14,
    marginLeft: 10,
  },
  selectedFriend: {
    backgroundColor: '#444',
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
  noPostsText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default CircleDetailsScreen;
