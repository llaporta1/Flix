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
      {/* Three-bar Menu Button */}
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
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('Login')}>
            <Image source={require('../../assets/logout.png')} style={styles.menuIconItem} />
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        {/* Friend Circle Option */}
        <TouchableOpacity style={styles.bottomNavItem} onPress={() => handleMenuSelection('MyFriendsScreen')}>
          <Image source={require('../../assets/circle.png')} style={styles.bottomNavIcon} />
        </TouchableOpacity>

        {/* Create Post Option */}
        <TouchableOpacity style={styles.bottomNavItem} onPress={() => handleMenuSelection('MyFlixScreen')}>
          <View style={styles.addButtonWrapper}>
            <Image source={require('../../assets/add.png')} style={styles.addButtonIcon} />
          </View>
        </TouchableOpacity>

        {/* Home Feed Option */}
        <TouchableOpacity style={styles.bottomNavItem} onPress={() => handleMenuSelection('HomeScreen')}>
          <Image source={require('../../assets/home.png')} style={styles.bottomNavIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end', // Position the bottom menu at the bottom
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff', // Tint the icon to white
  },
  profileButton: {
    padding: 8,
  },
  profilePhotoHolder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#d3d3d3',
  },
  menuContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 20, // Rounded corners
    elevation: 5,
    width: 180, // Adjust width as needed
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Adjusted for closer line
  },
  horizontalLine: {
    borderBottomColor: '#000', // Black line
    borderBottomWidth: 1,
    width: '100%', // Span the entire width
    marginBottom: 15, // Spacing before the options
  },
  greetingText: {
    fontSize: 16,
    color: '#000000',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  menuItem: {
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Center align vertically
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  menuIconItem: {
    width: 18, // Smaller size for all icons
    height: 18,
    marginRight: 8, // Spacing between icon and text
    tintColor: '#000', // Set icon color to black
  },
  compositeIconContainer: {
    width: 18, // Set size for the composite icon container
    height: 18,
    marginRight: 8, // Spacing between icon and text
    position: 'relative', // Relative positioning for overlay
  },
  circleIcon: {
    width: 18, // Same size as the container
    height: 18,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  peopleIcon: {
    width: 10, // Slightly smaller size for the inner icon
    height: 10,
    position: 'absolute',
    top: 4, // Center the inner icon vertically
    left: 4, // Center the inner icon horizontally
  },
  menuText: {
    fontSize: 16,
    color: '#000000',
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 20, // Position at the bottom of the screen
    left: '25%', // Center the menu horizontally by reducing the width
    right: '25%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff', // White background
    paddingVertical: 5,
    borderRadius: 20, // More compact shape
    elevation: 5, // Shadow effect
    height: 40, // Shorter height for the bar
  },
  bottomNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Equal space for all items
  },
  bottomNavIcon: {
    width: 20,
    height: 20,
    tintColor: '#000', // Set icon color to black
  },
  addButtonWrapper: {
    width: 40,
    height: 40,
    backgroundColor: '#fff', // White background
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  addButtonIcon: {
    width: 20,
    height: 20,
    tintColor: '#000', // Set icon color to black
  },
});

export default Menu;
