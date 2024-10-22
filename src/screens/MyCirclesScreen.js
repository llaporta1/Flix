import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebaseConfigs';

const MyCirclesScreen = ({ navigateTo }) => {
  const [circles, setCircles] = useState([]);
  const [profileImages, setProfileImages] = useState({}); // Store profile images for each circle

  useEffect(() => {
    fetchFriendCircles();
  }, []);

  const fetchFriendCircles = async () => {
    try {
      const userId = auth.currentUser.uid;
      const q = query(collection(firestore, 'friendCircles'), where('members', 'array-contains', userId));
      const querySnapshot = await getDocs(q);
      const circlesData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCircles(circlesData);

      // Fetch profile images for circle members
      const profileImagePromises = circlesData.map(circle => fetchCircleMemberImages(circle));
      await Promise.all(profileImagePromises);
    } catch (error) {
      console.error('Error fetching circles:', error);
    }
  };

  const fetchCircleMemberImages = async (circle) => {
    const memberImages = await Promise.all(
      circle.members.slice(0, 4).map(async (memberId) => {
        const memberDoc = await getDoc(doc(firestore, 'users', memberId));
        if (memberDoc.exists()) {
          return memberDoc.data().profileImageUri || null;
        }
        return null;
      })
    );

    setProfileImages(prevState => ({
      ...prevState,
      [circle.id]: memberImages,
    }));
  };

  const renderCircleItem = ({ item }) => {
    const memberImages = profileImages[item.id] || [];
    const totalMembers = memberImages.length;

    // Define the radius for positioning around the circle
    const radius = 75; // Adjust the radius to position profile images around the outer edge of the circle

    // Function to calculate positions around the circle, starting from the bottom
    const getProfileImagePosition = (index, total) => {
      const angleOffset = Math.PI / 4; // Offset the angle to make the first image at the bottom
      const angleStep = Math.PI / (total + 1); // Split the circle into equal parts for members
      const angle = angleOffset + (index * angleStep); // Adjust angle for each image
      const x = radius * Math.cos(angle); // Calculate X position
      const y = radius * Math.sin(angle); // Calculate Y position
      return { x, y };
    };

    return (
      <TouchableOpacity
        style={styles.circleItem}
        onPress={() => navigateTo('CircleDetails', { circleId: item.id })}
      >
        <View style={styles.circleContainer}>
          <ImageBackground
            source={item.imageUrl ? { uri: item.imageUrl } : require('../../assets/images.jpg')}
            style={styles.circleImage}
            imageStyle={styles.circleImageStyle}
            resizeMode="cover" // Ensures the image covers and zooms in
          >
            <Text style={styles.circleName}>{item.name}</Text>
          </ImageBackground>

          {/* Profile images positioned around the circle */}
          <View style={styles.profileImageWrapper}>
            {memberImages.map((uri, index) => {
              const { x, y } = getProfileImagePosition(index, totalMembers);
              return (
                <Image
                  key={index}
                  source={uri ? { uri } : require('../../assets/profile-placeholder.png')}
                  style={[
                    styles.memberProfileImage,
                    {
                      position: 'absolute',
                      left: radius + x - 20, // Adjust X position
                      top: radius - y - 20,  // Adjust Y position
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigateTo('FriendCircles')} // Go back to main Friend Circles screen
      >
        <Image
          source={require('../../assets/back-arrow.png')}
          style={styles.backArrowImage}
        />
      </TouchableOpacity>

      <Text style={styles.headerText}>My Friend Circles</Text>
      <FlatList
        data={circles}
        renderItem={renderCircleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.circleList}
      />
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
  headerText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
  },
  circleList: {
    paddingHorizontal: 20,
  },
  circleItem: {
    marginBottom: 40, // Add space between each circle
    alignItems: 'center',
  },
  circleContainer: {
    alignItems: 'center',
  },
  circleImage: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  circleImageStyle: {
    borderRadius: 75, // Make the background image circular
  },
  circleName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: '#000', // Add a black outline
    textShadowOffset: { width: 4, height: 4 }, // Increase the offset for a stronger effect
    textShadowRadius: 15, // Increase the shadow radius for a more visible outline
  },
  profileImageWrapper: {
    position: 'absolute',
    width: 150,
    height: 150,
    top: 0,
    left: 0,
  },
  memberProfileImage: {
    width: 35, // Slightly smaller profile images
    height: 35,
    borderRadius: 20,
    borderColor: '#fff',
    borderWidth: 2,
  },
});

export default MyCirclesScreen;
