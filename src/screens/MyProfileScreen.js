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
    const [isEditing, setIsEditing] = useState(false); // To toggle between edit and save modes

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
                setIsEditing(true); // Enable editing mode after image selection
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
            const imagePath = `profileImages/${auth.currentUser.uid}/${Date.now()}.jpg`;
            const storageRef = ref(storage, imagePath);

            const snapshot = await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(snapshot.ref);
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
                setIsEditing(false); // Disable editing mode after saving
            } else {
                setError('Failed to save profile image.');
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile');
        }
    };

    const handleEditProfile = () => {
        setIsEditing(true); // Enable editing mode
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
                placeholderTextColor="#d3d3d3" // Set placeholder text color to gray
                value={fullName}
                onChangeText={(text) => {
                    setFullName(text);
                    setIsEditing(true); // Enable editing mode when user types
                }}
                editable={isEditing}
            />
            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#d3d3d3" // Set placeholder text color to gray
                value={username}
                onChangeText={(text) => {
                    setUsername(text);
                    setIsEditing(true); // Enable editing mode when user types
                }}
                editable={isEditing}
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#d3d3d3" // Set placeholder text color to gray
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    setIsEditing(true); // Enable editing mode when user types
                }}
                editable={isEditing}
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#d3d3d3" // Set placeholder text color to gray
                value={password}
                secureTextEntry
                editable={false} // Keep password field read-only
            />
            <TouchableOpacity
                onPress={isEditing ? handleSaveProfile : handleEditProfile}
                style={styles.button}
            >
                <Text style={styles.buttonText}>
                    {isEditing ? 'Save Profile Changes' : 'Edit Profile'}
                </Text>
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#000', // Black background
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
        bottom: 0, // Adjusted to move the icon slightly above the bottom of the image
        right: 105,  // Adjusted to move the icon slightly left from the right edge of the image
        backgroundColor: '#000', // Black background for the camera icon
        borderRadius: 15,
        padding: 2,
    },
    cameraIcon: {
        width: 30,
        height: 30,
        tintColor: '#fff', // White camera icon
    },
    input: {
        width: '100%',
        padding: 10,
        borderColor: '#d3d3d3', // Light gray borders
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
        color: '#fff', // White text color
    },
    button: {
        backgroundColor: '#333', // Darker button background
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff', // White text color
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        marginTop: 10,
    },
});

export default MyProfileScreen;
