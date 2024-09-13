import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image, Alert, Platform, PermissionsAndroid } from 'react-native';
import { auth, firestore } from '../../firebase/firebaseConfigs';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import Menu from '../components/Menu';
import Contacts from 'react-native-contacts';
import email from 'react-native-email';

const MyFriendsScreen = ({ navigateTo }) => {
  const [activeTab, setActiveTab] = useState('addFriends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [requestCount, setRequestCount] = useState(0);
  const [mutualFriends, setMutualFriends] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFriendRequests();
    fetchFriendsList();
    syncContacts();
  }, []);

  const fetchFriendRequests = async () => {
    const userId = auth.currentUser.uid;
    const friendRequestsRef = collection(firestore, 'friendRequests');
    const q = query(friendRequestsRef, where('receiverId', '==', userId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    const requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setFriendRequests(requests);
    setRequestCount(requests.length); // Set the count of friend requests
  };

  const fetchFriendsList = async () => {
    const userId = auth.currentUser.uid;
    const userDocRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const friends = userDoc.data().friends || [];
  
    const friendsDetails = await Promise.all(
      friends.map(async (friendId) => {
        const friendDocRef = doc(firestore, 'users', friendId);
        const friendDoc = await getDoc(friendDocRef);
        return {
          id: friendDoc.id,
          fullName: friendDoc.data().fullName,
          username: friendDoc.data().username,
          profileImageUri: friendDoc.data().profileImageUri || null, // Fetch the profile image URI if it exists
        };
      })
    );
  
    setFriendsList(friendsDetails);
  };

  const renderItem = ({ item }) => (
    <View style={styles.friendItem}>
      <Image
        source={item.profileImageUri ? { uri: item.profileImageUri } : require('../../assets/profile-placeholder.png')}
        style={styles.placeholderImage}
      />
      <View style={styles.friendItemText}>
        <Text style={styles.friendText}>{item.fullName}</Text>
        <Text style={styles.usernameText}>{item.username}</Text>
      </View>
    </View>
  );

  const syncContacts = async () => {
    try {
      if (Contacts?.requestPermission && Contacts?.getAll) {
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
      } else {
        console.error('Contacts module is not loaded correctly or methods are missing.');
        setError('Contacts module is not loaded correctly or methods are missing.');
      }
    } catch (error) {
      console.error('Error syncing contacts: ', error);
      setError('Failed to sync contacts');
    }
  };

  const checkRegisteredUsers = async (contactsWithEmail) => {
    try {
        const registeredContacts = [];
        const unregisteredContacts = [];
        const userEmail = auth.currentUser.email; // Get the logged-in user's email
        const userId = auth.currentUser.uid;

        // Fetch the current user's friends
        const userDocRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        const userFriends = userDoc.data().friends || [];

        for (let contact of contactsWithEmail) {
            const email = contact.emailAddresses[0]?.email;

            // Skip if the contact's email matches the user's email
            if (email === userEmail) {
                continue;
            }

            const q = query(collection(firestore, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const contactUserId = querySnapshot.docs[0].id; // Assuming only one user matches
                const isFriend = userFriends.includes(contactUserId);

                // Skip adding to the list if the contact is already a friend
                if (!isFriend) {
                    registeredContacts.push({
                        ...contact,
                        isRegistered: true,
                    });
                }
            } else {
                unregisteredContacts.push({
                    ...contact,
                    isRegistered: false,
                });
            }
        }

        setContacts([...registeredContacts, ...unregisteredContacts]);
    } catch (error) {
        console.error('Error checking registered users: ', error);
        setError('Failed to check registered users');
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length > 0) {
      try {
        const usersRef = collection(firestore, 'users');
        const q = query(
          usersRef,
          where('username', '>=', searchQuery),
          where('username', '<=', searchQuery + '\uf8ff')
        );
        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            fullName: doc.data().fullName,
            username: doc.data().username,
            profileImageUri: doc.data().profileImageUri || null, // Fetch the profile image URI if it exists
          }))
          .filter(user => user.id !== auth.currentUser.uid); // Ensure the current user is not in the list

        const mutuals = await Promise.all(
          users.map(async (user) => {
            const userDocRef = doc(firestore, 'users', user.id);
            const userDoc = await getDoc(userDocRef);
            const userFriends = userDoc.data().friends || [];
            const mutual = userFriends.filter(friendId => friendsList.some(friend => friend.id === friendId));

            const mutualDetails = await Promise.all(
              mutual.map(async (mutualId) => {
                const mutualDocRef = doc(firestore, 'users', mutualId);
                const mutualDoc = await getDoc(mutualDocRef);
                return { id: mutualId, fullName: mutualDoc.data().fullName, username: mutualDoc.data().username };
              })
            );

            return { ...user, mutualFriends: mutualDetails, isFriend: friendsList.some(friend => friend.id === user.id) };
          })
        );

        setSearchResults(mutuals);
      } catch (error) {
        console.error('Error searching users: ', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const sendFriendRequest = async (receiverId) => {
    try {
      const senderId = auth.currentUser.uid;

      // Check if the users are already friends
      const senderDocRef = doc(firestore, 'users', senderId);
      const senderDoc = await getDoc(senderDocRef);
      const senderFriends = senderDoc.data().friends || [];

      if (senderFriends.includes(receiverId)) {
        Alert.alert('You are already friends with this user');
        return;
      }

      const receiverDocRef = doc(firestore, 'users', receiverId);
      const receiverDoc = await getDoc(receiverDocRef);
      const receiverFriends = receiverDoc.data().friends || [];

      if (receiverFriends.includes(senderId)) {
        Alert.alert('You are already friends with this user');
        return;
      }

      // Get the sender's username
      const senderUsername = senderDoc.data().username;

      const friendRequestsRef = collection(firestore, 'friendRequests');
      await addDoc(friendRequestsRef, {
        senderId,
        senderUsername,  // Add sender's username
        receiverId,
        status: 'pending',
        timestamp: Date.now(),
      });
      Alert.alert('Friend request sent', `Friend request sent to ${receiverDoc.data().fullName}.`);
    } catch (error) {
      console.error('Error sending friend request: ', error);
      Alert.alert('Error', 'Failed to send friend request.');
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      // Get the friend request data
      const requestRef = doc(firestore, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      const { senderId, receiverId } = requestDoc.data();

      // Update the friend request status to 'accepted'
      await updateDoc(requestRef, {
        status: 'accepted',
      });

      // Update the sender's friends list
      const senderDocRef = doc(firestore, 'users', senderId);
      await updateDoc(senderDocRef, {
        friends: arrayUnion(receiverId),
      });

      // Update the receiver's friends list
      const receiverDocRef = doc(firestore, 'users', receiverId);
      await updateDoc(receiverDocRef, {
        friends: arrayUnion(senderId),
      });

      fetchFriendRequests(); // Refresh the friend requests list
      fetchFriendsList(); // Refresh the friends list
      Alert.alert('Friend request accepted', 'Friend request accepted.');
    } catch (error) {
      console.error('Error accepting friend request: ', error);
      Alert.alert('Error', 'Failed to accept friend request.');
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      const requestRef = doc(firestore, 'friendRequests', requestId);
      await updateDoc(requestRef, {
        status: 'declined',
      });
      fetchFriendRequests(); // Refresh the friend requests list
      Alert.alert('Friend request declined', 'Friend request declined.');
    } catch (error) {
      console.error('Error declining friend request: ', error);
      Alert.alert('Error', 'Failed to decline friend request.');
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'requests') {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, {
        lastViewedRequests: Date.now(),
      });
    } else if (tab === 'friends') {
      fetchFriendsList(); // Fetch the friends list whenever the "My Friends" tab is selected
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
          onPress={() => item.isRegistered ? handleAddFriend(item) : handleInvite(item)}
        >
          <Text style={styles.addButtonText}>
            {item.isRegistered ? 'Add Friend' : 'Invite to FLIX'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const handleAddFriend = async (contact) => {
    try {
      const receiverEmail = contact.emailAddresses[0]?.email;
      const q = query(collection(firestore, 'users'), where('email', '==', receiverEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert('User not found', 'The user is not registered with FLIX.');
        return;
      }

      const receiverDoc = querySnapshot.docs[0];
      const receiverId = receiverDoc.id;

      const senderId = auth.currentUser.uid;

      // Check if the users are already friends
      const senderDocRef = doc(firestore, 'users', senderId);
      const senderDoc = await getDoc(senderDocRef);
      const senderFriends = senderDoc.data().friends || [];

      if (senderFriends.includes(receiverId)) {
        Alert.alert('You are already friends with this user');
        return;
      }

      const receiverFriends = receiverDoc.data().friends || [];

      if (receiverFriends.includes(senderId)) {
        Alert.alert('You are already friends with this user');
        return;
      }

      // Get the sender's username
      const senderUsername = senderDoc.data().username;

      const friendRequestsRef = collection(firestore, 'friendRequests');
      await addDoc(friendRequestsRef, {
        senderId,
        senderUsername,  // Add sender's username
        receiverId,
        status: 'pending',
        timestamp: Date.now(),
      });

      Alert.alert('Friend request sent', `${contact.givenName} ${contact.familyName} has been sent a friend request.`);
    } catch (error) {
      console.error('Error adding friend: ', error);
      Alert.alert('Error', 'Failed to send friend request.');
    }
  };

  const handleInvite = (contact) => {
    const emailTo = contact.emailAddresses[0]?.email;
    const subject = 'Join me on FLIX!';
    const body = `Hey ${contact.givenName} ${contact.familyName},\n\nI'm using this awesome app called FLIX to share moments with friends. I'd love to connect with you there. Click the link below to join:\n\n[FLIX SIGNUP LINK]\n\nLooking forward to seeing you on FLIX!\n\nBest regards,`;

    email(emailTo, {
      subject,
      body,
    }).catch(console.error);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Only one Menu component here */}
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>My Friends</Text>
        <View style={styles.tabsContainer}>
          <TouchableOpacity onPress={() => handleTabChange('addFriends')}>
            <Text style={activeTab === 'addFriends' ? styles.activeTab : styles.inactiveTab}>Add Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTabChange('requests')}>
            <Text style={activeTab === 'requests' ? styles.activeTab : styles.inactiveTab}>
              Requests {requestCount > 0 && `(${requestCount})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleTabChange('friends')}>
            <Text style={activeTab === 'friends' ? styles.activeTab : styles.inactiveTab}>My Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Content based on the active tab */}
        {activeTab === 'addFriends' && (
          <View style={styles.inner}>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Find friends"
                placeholderTextColor="#aaa" // Set placeholder text color to a light gray
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
                onSubmitEditing={handleSearch}
                autoCapitalize="none"
              />
            </View>
            {searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.friendItem}>
                    <Image
                      source={item.profileImageUri ? { uri: item.profileImageUri } : require('../../assets/profile-placeholder.png')}
                      style={styles.placeholderImage}
                    />
                    <View style={styles.friendItemText}>
                      <Text style={styles.friendText}>{item.fullName}</Text>
                      <Text style={styles.usernameText}>{item.username}</Text>
                      {item.mutualFriends.length > 0 && (
                        <TouchableOpacity onPress={() => setMutualFriends(item.mutualFriends)}>
                          <Text style={styles.mutualFriendsText}>{item.mutualFriends.length} mutual friends</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View>
                      {item.isFriend ? (
                        <Text style={styles.friendText}>Friends</Text>
                      ) : (
                        <TouchableOpacity onPress={() => sendFriendRequest(item.id)}>
                          <Text style={styles.friendText}>
                            {friendRequests.some(request => request.receiverId === item.id && request.status === 'pending') ? 'Request Sent' : 'Send Friend Request'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              />
            ) : (
              searchQuery.length > 0 && <Text style={styles.noResultsText}>No results found</Text>
            )}
            <Text style={styles.contactsHeader}>From my Contacts</Text>
            {contacts.length > 0 ? (
              <FlatList
                data={contacts}
                keyExtractor={(item) => item.recordID}
                renderItem={renderContact}
              />
            ) : (
              <Text style={styles.noResultsText}>No contacts found</Text>
            )}
          </View>
        )}

        {activeTab === 'requests' && (
          <>
            {friendRequests.length > 0 ? (
              <FlatList
                data={friendRequests}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.friendRequestItem}>
                    <Text style={styles.friendText}>{item.senderUsername}</Text>
                    <TouchableOpacity onPress={() => acceptFriendRequest(item.id)}>
                      <Text style={styles.friendText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => declineFriendRequest(item.id)}>
                      <Text style={styles.friendText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            ) : (
              <Text style={styles.noResultsText}>No Requests</Text>
            )}
          </>
        )}

        {activeTab === 'friends' && (
          <FlatList
            data={friendsList}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}  // Use the updated renderItem function here
            ListEmptyComponent={() => (
              <Text style={styles.noResultsText} onPress={() => handleTabChange('addFriends')}>
                Find friends
              </Text>
            )}
          />
        )}

        {mutualFriends.length > 0 && (
          <View style={styles.mutualFriendsContainer}>
            <Text style={styles.mutualFriendsHeader}>Mutual Friends</Text>
            {mutualFriends.map((friend, index) => (
              <View key={index} style={styles.friendItem}>
                <Image source={require('../../assets/profile-placeholder.png')} style={styles.placeholderImage} />
                <View style={styles.friendItemText}>
                  <Text style={styles.friendText}>{friend.fullName}</Text>
                  <Text style={styles.usernameText}>{friend.username}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={() => setMutualFriends([])}>
              <Text style={styles.closeMutualFriends}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Set background color to black
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
    color: '#fff', // Set text color to white
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  activeTab: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
    color: '#fff', // Set text color to white
  },
  inactiveTab: {
    color: '#aaa', // Set inactive tab text color to gray
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  searchInput: {
    flex: 1,
    borderColor: '#fff', // Set border color to white
    borderWidth: 1,
    borderRadius: 5,
    padding: 5,
    color: '#fff', // Set input text color to white
  },
  noResultsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#aaa', // Set no results text color to gray
    textDecorationLine: 'underline',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Align text and button to the right
    padding: 10,
    borderBottomColor: '#555', // Set border color to dark gray
    borderBottomWidth: 1,
  },
  friendItemText: {
    flex: 1, // Take up remaining space
    marginLeft: 10,
  },
  friendText: {
    color: '#fff', // Set text color to white
  },
  usernameText: {
    fontSize: 12,
    color: '#aaa', // Set username text color to gray
  },
  placeholderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d3d3d3',
  },
  mutualFriendsText: {
    textDecorationLine: 'underline',
    color: '#00f', // Set mutual friends text color to blue
  },
  friendRequestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomColor: '#555', // Set border color to dark gray
    borderBottomWidth: 1,
  },
  inner: {
    paddingHorizontal: 20,
  },
  contactsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#fff', // Set contacts header text color to white
  },
  contactItem: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#333', // Set contact item background color to dark gray
    borderRadius: 5,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff', // Set contact name text color to white
  },
  contactEmail: {
    fontSize: 14, // Smaller text for the email
    color: '#aaa', // Set email text color to gray
  },
  addButton: {
    marginTop: 10,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff', // Set button text color to white
    fontSize: 16,
  },
  mutualFriendsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000', // Set background color to black
    padding: 20,
    borderTopColor: '#555', // Set border color to dark gray
    borderTopWidth: 1,
  },
  mutualFriendsHeader: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff', // Set header text color to white
  },
  closeMutualFriends: {
    textDecorationLine: 'underline',
    color: '#00f', // Set close text color to blue
    marginTop: 10,
  },
});

export default MyFriendsScreen;
