import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
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

    const handleNameChange = (text) => {
        setFullName(text);
        if (text !== '') {
            setIsEditing(true); // Show save button if the name is being edited
        } else {
            setIsEditing(false);
        }
    };

    return (
        <View style={styles.container}>
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

            {/* Full Name TextBox with Pen Icon */}
            <View style={styles.nameContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#d3d3d3"
                    value={fullName}
                    onChangeText={handleNameChange}
                    editable={true}
                />
                <TouchableOpacity style={styles.penIconContainer}>
                    <Image source={require('../../assets/pen.png')} style={styles.penIcon} />
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#d3d3d3"
                value={username}
                editable={false} // Disable editing for username
            />
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#d3d3d3"
                value={email}
                editable={false} // Disable editing for email
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#d3d3d3"
                value={password} // Masked password display
                editable={false} // Disable editing for password
            />

            {/* Save Profile Changes button only appears when name is changed */}
            {isEditing && (
                <TouchableOpacity onPress={handleSaveProfile} style={styles.button}>
                    <Text style={styles.buttonText}>Save Profile Changes</Text>
                </TouchableOpacity>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#000',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
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
        right: 105,
        backgroundColor: '#000',
        borderRadius: 15,
        padding: 2,
    },
    cameraIcon: {
        width: 30,
        height: 30,
        tintColor: '#fff',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        padding: 10,
        borderColor: '#d3d3d3',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20,
        color: '#fff',
    },
    penIconContainer: {
        padding: 10,
    },
    penIcon: {
        width: 24,
        height: 24,
        tintColor: '#fff',
    },
    button: {
        backgroundColor: '#333',
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
