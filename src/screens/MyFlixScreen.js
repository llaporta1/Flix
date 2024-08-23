import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import { getDoc, doc, collection, addDoc } from 'firebase/firestore';

const MyFlixScreen = ({ navigateTo }) => {
  const [caption, setCaption] = useState('');
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            setUsername(userDoc.data().username);
          }
        }
      } catch (err) {
        console.error('Error fetching user profile: ', err);
        setError('Failed to fetch user profile');
      }
    };

    fetchUserProfile();
  }, []);

  const handleCreatePost = async () => {
    if (!selectedImageUri) {
      setError('Please select an image');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user) {
        const newPost = {
          userId: user.uid,
          username: username,
          imageUri: selectedImageUri,
          caption: caption,
          timestamp: new Date(),
        };

        await addDoc(collection(firestore, 'posts'), newPost);
        setCaption('');
        setSelectedImageUri(null);
        setError(null);
        alert('Post created successfully!');
      } else {
        setError('User not authenticated');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    }
  };

  const selectImage = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: false,
      });

      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('ImagePicker Error: ', response.errorMessage);
        setError('Failed to pick image');
      } else {
        const source = response.assets[0].uri;
        setSelectedImageUri(source);
      }
    } catch (error) {
      console.error('Error launching image library: ', error);
      setError('Error launching image library');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigateTo('Home')}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Create a Post</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter caption"
        value={caption}
        onChangeText={setCaption}
      />
      <TouchableOpacity onPress={selectImage} style={styles.button}>
        <Text style={styles.buttonText}>Select Image</Text>
      </TouchableOpacity>
      {selectedImageUri && <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity onPress={handleCreatePost} style={styles.button}>
        <Text style={styles.buttonText}>Create Post</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  imagePreview: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
  },
});

export default MyFlixScreen;
