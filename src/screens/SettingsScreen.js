import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const SettingsScreen = ({ navigateTo }) => {
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('NotificationSettings')}>
        <Text style={styles.settingText}>Notification Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('PrivacySettings')}>
        <Text style={styles.settingText}>Privacy Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('AccountSettings')}>
        <Text style={styles.settingText}>Account Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('DataStorage')}>
        <Text style={styles.settingText}>Data & Storage</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('Support')}>
        <Text style={styles.settingText}>Support</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('Legal')}>
        <Text style={styles.settingText}>Legal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  settingOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 18,
    color: '#333',
  },
});

export default SettingsScreen;
