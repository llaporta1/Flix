import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import { getDoc, doc, collection, addDoc } from 'firebase/firestore';

const MyFlixScreen = ({ navigateTo }) => {
    const [caption, setCaption] = useState('');
    const [error, setError] = useState(null);
    const [username, setUsername] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);

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
        if (selectedImages.length === 0) {
            setError('Please select at least one image');
            return;
        }

        try {
            const user = auth.currentUser;
            if (user) {
                const newPost = {
                    userId: user.uid,
                    username: username,
                    imageUris: selectedImages, // Save array of image URIs
                    caption: caption,
                    timestamp: new Date(),
                };

                await addDoc(collection(firestore, 'posts'), newPost);
                setCaption('');
                setSelectedImages([]);
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

    const selectImages = async () => {
        try {
            const response = await launchImageLibrary({
                mediaType: 'photo',
                includeBase64: false,
                selectionLimit: 10, // Allow selecting up to 10 images
            });

            if (response.didCancel) {
                console.log('User cancelled image picker');
            } else if (response.errorMessage) {
                console.error('ImagePicker Error: ', response.errorMessage);
                setError('Failed to pick images');
            } else {
                const selectedUris = response.assets.map(asset => asset.uri);
                setSelectedImages(selectedUris);
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
            <TouchableOpacity onPress={selectImages} style={styles.button}>
                <Text style={styles.buttonText}>Select Images</Text>
            </TouchableOpacity>
            <ScrollView horizontal style={styles.imagePreviewContainer}>
                {selectedImages.map((uri, index) => (
                    <Image key={index} source={{ uri }} style={styles.imagePreview} />
                ))}
            </ScrollView>
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
    imagePreviewContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    imagePreview: {
        width: 100,
        height: 100,
        marginRight: 10,
    },
    errorText: {
        color: 'red',
        marginBottom: 20,
    },
});

export default MyFlixScreen;
