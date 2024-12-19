import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, Modal } from 'react-native';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import { doc, setDoc, Timestamp } from 'firebase/firestore'; // Import doc and setDoc

const PrivacySettingsScreen = ({ navigateTo }) => {
  const [privacyPolicyVisible, setPrivacyPolicyVisible] = useState(false);

  // Handle request to view/download data and save it to Firestore using setDoc
  const handleRequestViewDownload = async () => {
    try {
      const userId = auth.currentUser.uid; // Get the current user ID
      await setDoc(doc(firestore, 'viewDataRequests', userId), {
        userID: userId,
        timestamp: Timestamp.now(), // Store the current timestamp as the request time
      });
      Alert.alert(
        'Request Sent',
        'Your request to view/download personal data has been submitted.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'There was a problem submitting your request.');
    }
  };

  // Handle request to delete data and save it to Firestore using setDoc
  const handleRequestDeleteData = async () => {
    try {
      const userId = auth.currentUser.uid; // Get the current user ID
      await setDoc(doc(firestore, 'deleteDataRequests', userId), {
        userID: userId,
        timestamp: Timestamp.now(), // Store the current timestamp as the request time
      });
      Alert.alert(
        'Request Sent',
        'Your request to delete personal data has been submitted.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting request:', error);
      Alert.alert('Error', 'There was a problem submitting your request.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Arrow to go back to the Settings screen */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateTo('Settings')}>
          <Image
            source={require('../../assets/back-arrow.png')} // Replace with your back-arrow image
            style={styles.backArrow}
          />
        </TouchableOpacity>
        <Text style={styles.headerText}>Privacy Settings</Text>
      </View>

      <ScrollView style={styles.contentContainer}>
        <TouchableOpacity style={styles.settingOption} onPress={handleRequestViewDownload}>
          <Text style={styles.settingText}>Request to View/Download Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingOption} onPress={handleRequestDeleteData}>
          <Text style={styles.settingText}>Request to Delete Data</Text>
        </TouchableOpacity>

        {/* Other privacy options */}
        <TouchableOpacity style={styles.settingOption} onPress={() => navigateTo('AppPermissions')}>
          <Text style={styles.settingText}>App Permissions</Text>
        </TouchableOpacity>

        {/* Show Privacy Policy */}
        <TouchableOpacity style={styles.settingOption} onPress={() => setPrivacyPolicyVisible(true)}>
          <Text style={styles.settingText}>Privacy Policy</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Privacy Policy Modal */}
      <Modal visible={privacyPolicyVisible} animationType="slide" transparent={false}>
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPrivacyPolicyVisible(false)}>
              <Image
                source={require('../../assets/back-arrow.png')} // Replace with your back-arrow image
                style={styles.backArrow}
              />
            </TouchableOpacity>
            <Text style={styles.modalHeaderText}>Privacy Policy</Text>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              {/* Your Privacy Policy text here */}
            </Text>
          </View>
        </ScrollView>
      </Modal>
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
    tintColor: '#fff', // Make the back arrow white if necessary
  },
  headerText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  settingOption: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  settingText: {
    fontSize: 18,
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000', // Dark background for the modal
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#111',
  },
  modalHeaderText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
});

export default PrivacySettingsScreen;
