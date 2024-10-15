import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Image,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebaseConfigs';

const MyCirclesScreen = ({ navigateTo }) => {
  const [circles, setCircles] = useState([]);
  
  useEffect(() => {
    fetchFriendCircles();
  }, []);

  const fetchFriendCircles = async () => {
    try {
      const userId = auth.currentUser.uid;
      const q = query(collection(firestore, 'friendCircles'), where('members', 'array-contains', userId));
      const querySnapshot = await getDocs(q);
      const circlesData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCircles(circlesData);
    } catch (error) {
      console.error('Error fetching circles:', error);
    }
  };

  const renderCircleItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.circleItem}
        onPress={() => navigateTo('CircleDetails', { circleId: item.id })}
      >
        <ImageBackground
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/150' }}
          style={styles.circleImage}
        >
          <Text style={styles.circleName}>{item.name}</Text>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity
        style={styles.backArrow}
        onPress={() => navigateTo('FriendCircles')} // Go back to main Friend Circles screen
      >
        <Image
          source={require('../../assets/back-arrow.png')} // Adjust this path to your back arrow icon
          style={styles.backArrowImage}
        />
      </TouchableOpacity>

      <Text style={styles.headerText}>My Friend Circles</Text>
      <FlatList
        data={circles}
        renderItem={renderCircleItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.circleList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backArrow: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  backArrowImage: {
    width: 30,
    height: 30,
    tintColor: '#fff',
  },
  headerText: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
  },
  circleList: {
    paddingHorizontal: 20,
  },
  circleItem: {
    marginBottom: 20,
  },
  circleImage: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleName: {
    color: '#fff',
    fontSize: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});

export default MyCirclesScreen;
