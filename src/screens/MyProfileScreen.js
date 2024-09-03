import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { firestore, auth, storage } from '../../firebase/firebaseConfigs';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Menu from '../components/Menu'; // Import the Menu component

const MyProfileScreen = ({ navigateTo }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setFullName(userData.fullName || '');
                        setUsername(userData.username || '');
                        setEmail(userData.email || '');
                        setPassword('********'); // Masked password display
                        setSelectedImageUri(userData.profileImageUri || ''); // Load existing profile image URI
                    }
                }
            } catch (err) {
                console.error('Error fetching user profile: ', err);
                setError('Failed to fetch user profile');
            }
        };

        fetchUserProfile();
    }, []);

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

    const uploadImageToStorage = async (uri) => {
        try {
            const response = await fetch(uri);
            if (!response.ok) {
                throw new Error('Failed to fetch the image from the given URI');
            }
    
            const blob = await response.blob();
            console.log('Blob created successfully'); // Debugging
            const imagePath = `profileImages/${auth.currentUser.uid}/${Date.now()}.jpg`;
            const storageRef = ref(storage, imagePath);
            console.log('Uploading to storage path:', imagePath); // Debugging
    
            const snapshot = await uploadBytes(storageRef, blob);
            console.log('Upload successful:', snapshot); // Debugging
    
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('Download URL:', downloadURL); // Debugging
            return downloadURL;
        } catch (error) {
            console.error('Error uploading image: ', error);
            setError('Failed to upload image');
            return null;
        }
    };

    const handleSaveProfile = async () => {
        try {
            let profileImageUri = selectedImageUri;
    
            if (selectedImageUri && !selectedImageUri.startsWith('https://')) {
                profileImageUri = await uploadImageToStorage(selectedImageUri);
            }
    
            if (profileImageUri) {
                const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
                await updateDoc(userDocRef, {
                    fullName,
                    username,
                    email,
                    profileImageUri,
                });
    
                Alert.alert('Profile updated successfully!');
            } else {
                setError('Failed to save profile image.');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile');
        }
    };

    return (
        <View style={styles.container}>
            {/* Add the Menu component without the profile image */}
            <Menu navigateTo={navigateTo} showProfileImage={false} />
            
            <View style={styles.imageContainer}>
                {selectedImageUri ? (
                    <Image source={{ uri: selectedImageUri }} style={styles.profileImage} />
                ) : (
                    <Image source={require('../../assets/profile-placeholder.png')} style={styles.profileImage} />
                )}
                <TouchableOpacity onPress={selectImage} style={styles.cameraIconContainer}>
                    <Image source={require('../../assets/camera.png')} style={styles.cameraIcon} />
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
            />
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                secureTextEntry
            />
            <TouchableOpacity onPress={handleSaveProfile} style={styles.button}>
                <Text style={styles.buttonText}>Save Profile</Text>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative', // Allows positioning of camera icon within container
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#d3d3d3',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 2,
    },
    cameraIcon: {
        width: 30,
        height: 30,
    },
    input: {
        width: '100%',
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
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        marginTop: 10,
    },
});

export default MyProfileScreen;
