import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { auth, firestore } from '../../firebase/firebaseConfigs'; // Ensure Firebase is imported here
import { collection, query, where, getDocs } from 'firebase/firestore'; // Firestore methods needed

const NavigationBar = ({ navigateTo }) => {

  const handleMyFlixPress = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const now = new Date();
      const postsRef = collection(firestore, 'posts');
      const userPostsQuery = query(
        postsRef,
        where('userId', '==', user.uid),
        where('timestamp', '>=', new Date(now - 24 * 60 * 60 * 1000)) // Last 24 hours
      );

      const querySnapshot = await getDocs(userPostsQuery);
      if (!querySnapshot.empty) {
        // User has a valid post from the last 24 hours, navigate to MyFlixExistingScreen
        const userPost = querySnapshot.docs[0].data(); // Fetch the first (or latest) post
        navigateTo('MyFlixExisting', { post: { id: querySnapshot.docs[0].id, ...userPost } });
      } else {
        // No valid post, navigate to MyFlixScreen to create a new post
        navigateTo('MyFlix');
      }
    } catch (err) {
      console.error('Error checking user post validity: ', err);
    }
  };

  return (
    <View style={styles.navContainer}>
      {/* Home Icon */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('Home')}>
        <Image source={require('../../assets/home.png')} style={[styles.navIcon, styles.HomeIcon]} />
      </TouchableOpacity>

      {/* Flix Icon */}
      <TouchableOpacity style={styles.navItem} onPress={handleMyFlixPress}>
        <Image source={require('../../assets/my-flix.png')} style={styles.FlixIcon} />
      </TouchableOpacity>

      {/* Friend Circles Icon (circle with people icon inside) */}
      <TouchableOpacity style={styles.navItem} onPress={() => navigateTo('MyCirclesFeed')}>
        <View style={styles.iconWrapper}>
          {/* Circle Background */}
          <Image source={require('../../assets/circle.png')} style={styles.circleIcon} />
          {/* People Icon (positioned on top of the circle) */}
          <Image source={require('../../assets/people1.png')} style={styles.peopleIcon} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    bottom: 20, // Adjust if needed
    width: width * 0.6, // 90% of the screen width for a long oval shape
    height: 50, // Thin oval height
    backgroundColor: '#fff', // Make the navigation bar white
    borderRadius: 30, // To make it a rounded oval shape
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out the icons evenly
    alignItems: 'center',
    alignSelf: 'center',
    elevation: 5, // Adds shadow for some depth
  },
  navItem: {
    flex: 1, // Equal space for each icon
    alignItems: 'center',
  },
  navIcon: {
    width: 30, // Icon size
    height: 30,
    resizeMode: 'contain', // Ensure the icons retain their original aspect ratio
  },
  HomeIcon: {
    tintColor: '#B492AC', // Light pink color for home icon
  },
  FlixIcon: {
    width: 40, // Icon size for My Flix
    height: 40,
  },
  // Wrapper for the friend circles icon (circle + people)
  iconWrapper: {
    position: 'relative', // To overlay the icons
    width: 35, // Adjust size for the combined icon
    height: 35,
  },
  circleIcon: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    tintColor: '#B492AC'
  },
  peopleIcon: {
    position: 'absolute',
    width: '60%', // Slightly smaller than the circle
    height: '60%',
    top: '20%', // Center the people icon within the circle
    left: '20%',
    tintColor: '#B492AC', // Light pink color for the friend circles icon
  },
});

export default NavigationBar;
