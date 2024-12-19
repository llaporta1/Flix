import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const ReportBugsScreen = ({ navigateTo }) => {
  const handleOpenGitHub = () => {
    Linking.openURL('https://github.com/llaporta1/Flix/issues');
  };

  const handleGoBack = () => {
    navigateTo('Settings'); // Navigate back to the SettingsScreen using navigateTo
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow using the image from assets */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Image source={require('../../assets/back-arrow.png')} style={styles.backArrowImage} />
      </TouchableOpacity>

      {/* Page Content */}
      <Text style={styles.headerText}>Report Bugs</Text>
      <Text style={styles.bodyText}>
        If you encounter any bugs or issues, please report them on our GitHub page.
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleOpenGitHub}>
        <Text style={styles.buttonText}>Go to GitHub Issues</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Dark background
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 1,
  },
  backArrowImage: {
    width: 24,  // Adjust the size as needed
    height: 24,
    tintColor: 'white', // Optional: ensures the image adapts to dark mode
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 16,
    color: '#bbb', // Lighter text for better readability
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
});

export default ReportBugsScreen;
