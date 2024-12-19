import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ScrollView, Platform } from 'react-native';

const AppPermissionsScreen = ({ navigateTo }) => {

  // Redirect user to app settings for both iOS and Android
  const openAppSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:'); // Open app settings in iOS
    } else {
      Linking.openURL('package:your.app.package'); // Open app settings in Android (replace with your app package name)
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow to go back to the Settings screen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo('PrivacySettings')}>
          <Image
            source={require('../../assets/back-arrow.png')} // Replace with the path to your back-arrow image
            style={styles.backArrow}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>App Permissions</Text>
      </View>

      <ScrollView style={styles.contentContainer}>
        {/* Contacts Permission */}
        <TouchableOpacity style={styles.permissionOption} onPress={openAppSettings}>
          <Text style={styles.permissionText}>Contacts Access</Text>
          <Text style={styles.descriptionText}>To connect and invite friends.</Text>
        </TouchableOpacity>

        {/* Photo Library Permission */}
        <TouchableOpacity style={styles.permissionOption} onPress={openAppSettings}>
          <Text style={styles.permissionText}>Photo Library Access</Text>
          <Text style={styles.descriptionText}>Required for selecting images from your library.</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Dark background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#111',
  },
  backArrow: {
    width: 24, // Adjust the size of the back arrow
    height: 24,
    marginRight: 10,
    tintColor: '#fff', // Make the back arrow white
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center', // Center the App Permissions text
    flex: 1, // This ensures the text stays centered regardless of the back arrow
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  permissionOption: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 18,
    color: '#fff',
  },
  descriptionText: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
});

export default AppPermissionsScreen;
