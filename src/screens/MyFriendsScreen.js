import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, PermissionsAndroid, Platform, StyleSheet, FlatList, Text, TouchableOpacity, Alert } from 'react-native';
import Contacts from 'react-native-contacts';
import email from 'react-native-email';
import Menu from '../components/Menu';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { firestore } from '../../firebase/firebaseConfigs';

const MyFriendsScreen = ({ navigateTo }) => {
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Contacts?.requestPermission && Contacts?.getAll) {
      syncContacts();
    } else {
      console.error('Contacts module is not loaded correctly or methods are missing.');
      setError('Contacts module is not loaded correctly or methods are missing.');
    }
  }, []);

  const syncContacts = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'This app would like to view your contacts.',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('Permission to access contacts was denied');
          setError('Permission to access contacts was denied');
          return;
        }
      } else if (Platform.OS === 'ios') {
        const permission = await Contacts.requestPermission();
        if (permission !== 'authorized') {
          console.warn('Permission to access contacts was denied');
          setError('Permission to access contacts was denied');
          return;
        }
      }

      const allContacts = await Contacts.getAll();
      const contactsWithEmail = allContacts.filter(contact =>
        contact.emailAddresses && contact.emailAddresses.length > 0
      );
      await checkRegisteredUsers(contactsWithEmail);
    } catch (error) {
      console.error('Error syncing contacts: ', error);
      setError('Failed to sync contacts');
    }
  };

  const checkRegisteredUsers = async (contactsWithEmail) => {
    try {
      const registeredContacts = [];
      const unregisteredContacts = [];

      for (let contact of contactsWithEmail) {
        const email = contact.emailAddresses[0]?.email;
        const q = query(collection(firestore, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          registeredContacts.push(contact);
        } else {
          unregisteredContacts.push(contact);
        }
      }

      setContacts([...registeredContacts, ...unregisteredContacts]);
    } catch (error) {
      console.error('Error checking registered users: ', error);
      setError('Failed to check registered users');
    }
  };

  const renderContact = ({ item }) => {
    const email = item.emailAddresses[0]?.email;
    const isRegistered = email && contacts.some(contact => contact.emailAddresses[0]?.email === email);

    return (
      <View style={styles.contactItem}>
        <Text style={styles.contactName}>{item.displayName}</Text>
        <Text style={styles.contactEmail}>{email}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => isRegistered ? handleAddFriend(item) : handleInvite(item)}
        >
          <Text style={styles.addButtonText}>
            {isRegistered ? 'Add Friend' : 'Invite to FLIX'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleAddFriend = (contact) => {
    // Implement logic to add a friend using the selected contact's email
    console.log('Adding friend:', contact.displayName);
    Alert.alert('Friend added', `${contact.displayName} has been added as a friend.`);
  };

  const handleInvite = (contact) => {
    const emailTo = contact.emailAddresses[0]?.email;
    const subject = 'Join me on FLIX!';
    const body = `Hey ${contact.displayName},\n\nI'm using this awesome app called FLIX to share moments with friends. I'd love to connect with you there. Click the link below to join:\n\n[FLIX SIGNUP LINK]\n\nLooking forward to seeing you on FLIX!\n\nBest regards,`;

    email(emailTo, {
      subject,
      body,
    }).catch(console.error);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.header}>
        <Text style={styles.title}>My Friends</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
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
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  contactItem: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactEmail: {
    fontSize: 16,
    color: '#555',
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
  errorText: {
    color: 'red',
    marginBottom: 20,
  },
});

export default MyFriendsScreen;
