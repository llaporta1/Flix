import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Menu from '../components/Menu'; // Assuming you have a Menu component

const SettingsScreen = ({ navigateTo }) => {
  return (
    <View style={styles.container}>
      {/* Menu component for navigation */}
      <Menu navigateTo={navigateTo} />

      {/* Settings Header */}
      <Text style={styles.headerText}>Settings</Text>

      {/* Add marginTop to push the content below the Menu */}
      <ScrollView style={[styles.contentContainer, { marginTop: 60 }]}>
        <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('PrivacySettings')}>
          <Image source={require('../../assets/privacy.png')} style={styles.icon} />
          <Text style={styles.settingText}>Privacy Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('ContactUs')}>
          <Image source={require('../../assets/mail1.png')} style={styles.icon} />
          <Text style={styles.settingText}>Contact Us</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('ReportBugs')}>
          <Image source={require('../../assets/caution.png')} style={styles.icon} />
          <Text style={styles.settingText}>Report Bugs</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Dark background for the settings page
  },
  headerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff', // White text for header
    textAlign: 'center',
    marginVertical: 20, // Space between header and content
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20, // Spacing from the top
    paddingBottom: 20,
  },
  settingOption: {
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center',
    paddingVertical: 20, // Padding around each option for better spacing
    paddingHorizontal: 20,
    borderColor: '#fff', // White outline
    borderWidth: 1, // Width of the outline
    borderRadius: 8, // Slight rounding of the edges
    marginBottom: 10, // Add margin between options
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10, // Space between icon and text
    tintColor: '#fff', // Tint the icon to white
  },
  settingText: {
    fontSize: 18,
    color: '#fff', // White text for dark mode
  },
});

export default SettingsScreen;
