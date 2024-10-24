import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { auth, firestore } from '../../firebase/firebaseConfigs';
import { getDoc, doc } from 'firebase/firestore';

const Menu = ({ navigateTo, showProfileImage = true }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [firstName, setFirstName] = useState(''); // State to hold user's first name

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleMenuSelection = (screen) => {
    setMenuVisible(false);
    navigateTo(screen);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfileImageUri(userData.profileImageUri || null);
            setFirstName(userData.fullName.split(' ')[0]); // Extract the first name from the full name
          }
        }
      } catch (error) {
        console.error('Error fetching user profile image: ', error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Image
            source={require('../../assets/menu-bar.png')}
            style={styles.menuIcon}
          />
        </TouchableOpacity>
        {showProfileImage && (
          <TouchableOpacity onPress={() => handleMenuSelection('MyProfile')} style={styles.profileButton}>
            {profileImageUri ? (
              <Image source={{ uri: profileImageUri }} style={styles.profilePhotoHolder} />
            ) : (
              <Image source={require('../../assets/profile-placeholder.png')} style={styles.profilePhotoHolder} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {menuVisible && (
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.greetingText}>Hi, {firstName}</Text>
            <TouchableOpacity onPress={toggleMenu} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>
          </View>

          {/* Add a horizontal line below the greeting */}
          <View style={styles.horizontalLine} />

          {/* Menu Items with Icons */}
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('Home')}>
            <Image source={require('../../assets/home.png')} style={styles.menuIconItem} />
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>

          {/* Composite Icon for Friend Circles */}
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('FriendCircles')}>
            <View style={styles.compositeIconContainer}>
              <Image source={require('../../assets/circle.png')} style={styles.circleIcon} />
              <Image source={require('../../assets/people1.png')} style={styles.peopleIcon} />
            </View>
            <Text style={styles.menuText}>Friend Circles</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('MyFriends')}>
            <Image source={require('../../assets/people2.png')} style={styles.menuIconItem} />
            <Text style={styles.menuText}>My Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('Memories')}>
            <Image source={require('../../assets/calendar.png')} style={styles.menuIconItem} />
            <Text style={styles.menuText}>Memories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('Settings')}>
            <Image source={require('../../assets/settings.png')} style={styles.menuIconItem} />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Login')}>
            <Image source={require('../../assets/logout.png')} style={styles.menuIconItem} />
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  menuButton: {
    padding: 16,
  },
  menuIcon: {
    width: 30,
    height: 30,
    tintColor: '#fff', // Tint the icon to white
  },
  profileButton: {
    padding: 16,
  },
  profilePhotoHolder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d3d3d3',
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 30, // Rounded corners
    elevation: 5,
    width: 250, // Adjust width as needed
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, // Adjusted for closer line
  },
  horizontalLine: {
    borderBottomColor: '#000', // Black line
    borderBottomWidth: 1,
    width: '100%', // Span the entire width
    marginBottom: 20, // Spacing before the options
  },
  greetingText: {
    fontSize: 18,
    color: '#000000',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#000000',
  },
  menuItem: {
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Align icons and text on the same line
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  menuIconItem: {
    width: 20, // Same size for all icons
    height: 20,
    marginRight: 15, // Spacing between icon and text
    tintColor: '#000', // Set icon color to black
  },
  compositeIconContainer: {
    width: 20, // Set size for the composite icon container
    height: 20,
    marginRight: 15, // Spacing between icon and text
    position: 'relative', // Relative positioning for overlay
  },
  circleIcon: {
    width: 20, // Same size as the container
    height: 20,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  peopleIcon: {
    width: 12, // Slightly smaller size for the inner icon
    height: 12,
    position: 'absolute',
    top: 4, // Center the inner icon vertically
    left: 4, // Center the inner icon horizontally
  },
  menuText: {
    fontSize: 18,
    color: '#000000',
  },
  menuIconSmall: {
    width: 20, // Smaller size for the icon next to text
    height: 20,
    marginRight: 8, // Space between icon and text
  },
});

export default Menu;
