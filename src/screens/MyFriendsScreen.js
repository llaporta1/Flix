import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Alert, PermissionsAndroid, Platform, StyleSheet } from 'react-native';
import { auth, firestore } from '../../firebase/firebaseConfigs';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth'; // Firebase method for sending emails
import Contacts from 'react-native-contacts';
import Menu from '../components/Menu';

const MyFriendsScreen = ({ navigateTo }) => {
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    syncContacts();
  }, []);

  const syncContacts = async () => {
    try {
      if (Contacts?.requestPermission && Contacts?.getAll) {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            setError('Permission to access contacts was denied');
            return;
          }
        } else if (Platform.OS === 'ios') {
          const permission = await Contacts.requestPermission();
          if (permission !== 'authorized') {
            setError('Permission to access contacts was denied');
            return;
          }
        }

        const allContacts = await Contacts.getAll();
        const contactsWithEmail = allContacts.filter(contact => contact.emailAddresses && contact.emailAddresses.length > 0);
        setContacts(contactsWithEmail);
      } else {
        setError('Contacts module is not loaded correctly.');
      }
    } catch (error) {
      setError('Failed to sync contacts');
    }
  };

  const handleInvite = async (contact) => {
    const emailTo = contact.emailAddresses[0]?.email;
    if (!emailTo) {
      Alert.alert('No Email', 'This contact does not have a valid email address.');
      return;
    }

    const senderName = auth.currentUser.displayName || auth.currentUser.email;

    try {
      await sendEmailVerification(auth.currentUser, {
        url: 'https://flixapp.com/invite',
        handleCodeInApp: true,
        email: emailTo,
        subject: 'Join me on FLIX!',
        body: `Hey, ${senderName} is inviting you to join FLIX!`
      });

      Alert.alert('Success', `Invitation sent to ${contact.givenName} ${contact.familyName}`);
    } catch (error) {
      console.error('Error sending invitation:', error);
      Alert.alert('Error', 'Failed to send invitation.');
    }
  };

  const renderContact = ({ item }) => {
    return (
      <View style={styles.contactItem}>
        <Text style={styles.contactName}>{`${item.givenName} ${item.familyName}`}</Text>
        {item.emailAddresses.map(email => (
          <Text key={email.id} style={styles.contactEmail}>{email.email}</Text>
        ))}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleInvite(item)}
        >
          <Text style={styles.addButtonText}>Invite to FLIX</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>My Friends</Text>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.recordID}
          renderItem={renderContact}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#fff',
  },
  contactItem: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactEmail: {
    fontSize: 14,
    color: '#aaa',
  },
  addButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default MyFriendsScreen;
