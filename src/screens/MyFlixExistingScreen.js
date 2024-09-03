import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';

const MyFlixExistingScreen = ({ route, navigateTo }) => {
  const { post } = route.params;
  const now = new Date();
  const postTime = post.timestamp.toDate();
  const timeDifference = (now - postTime) / (1000 * 60 * 60); // Difference in hours
  const hoursLeft = 24 - timeDifference;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigateTo('Home')}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <View style={styles.inner}>
        <Text style={styles.text}>Your Current Post</Text>
        <Image source={{ uri: post.imageUri }} style={styles.postImage} />
        <Text style={styles.postCaption}>{post.caption}</Text>
        <Text style={styles.timeLeftText}>
          You can post again in {hoursLeft.toFixed(1)} hours
        </Text>
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inner: {
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  postImage: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 20,
  },
  postCaption: {
    fontSize: 18,
    marginBottom: 10,
  },
  timeLeftText: {
    fontSize: 16,
    color: 'red',
  },
});

export default MyFlixExistingScreen;
