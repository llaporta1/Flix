// BackButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const BackButton = ({ navigateTo }) => {
  return (
    <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Settings')}>
      <Text style={styles.backButtonText}>Back</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: 10,
    backgroundColor: '#ddd',
    margin: 10,
    borderRadius: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#000',
  },
});

export default BackButton;
