import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BackButton from '../components/BackButton';  // Import BackButton

const NotificationSettings = ({ navigateTo }) => {
  return (
    <View style={styles.container}>
      <BackButton navigateTo={navigateTo} />
      <Text style={styles.text}>Notification Settings</Text>
      {/* Add notification setting options here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    color: '#333',
  },
});

export default NotificationSettings;
