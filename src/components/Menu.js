import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const Menu = ({ navigateTo }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleMenuSelection = (screen) => {
    setMenuVisible(false);
    navigateTo(screen);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleMenu} style={styles.menuButton}>
          <Image source={require('../../assets/menu-bar.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleMenuSelection('MyProfile')} style={styles.profileButton}>
          <View style={styles.profilePhotoHolder} />
        </TouchableOpacity>
      </View>
      {menuVisible && (
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('Home')}>
            <Text style={styles.menuText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('MyFriends')}>
            <Text style={styles.menuText}>My Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('Memories')}>
            <Text style={styles.menuText}>Memories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('Settings')}>
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('Help')}>
            <Text style={styles.menuText}>Help</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuSelection('Login')}>
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
    left: 10, // Moved more to the side
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
    width: 32,
    height: 32,
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
    backgroundColor: '#f4f4f4',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width: 200,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  menuText: {
    fontSize: 18,
    color: '#000000',
  },
});

export default Menu;
