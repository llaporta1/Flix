import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth'; // Import for email auth and password reset
import Menu from '../components/Menu'; // Import the Menu component

const MyProfileScreen = ({ navigateTo }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Masked password
    const [currentPassword, setCurrentPassword] = useState(''); // Input for current password
    const [newPassword, setNewPassword] = useState(''); // Input for new password
    const [showPasswordForm, setShowPasswordForm] = useState(false); // State to show/hide the password form
    const [isForgotPassword, setIsForgotPassword] = useState(false); // Toggle for forgot password flow
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
    const [error, setError] = useState(null);
    const [selectedImageUri, setSelectedImageUri] = useState(null);
    const [isEditing, setIsEditing] = useState(false); // To toggle between edit and save modes

    // Create a reference for the fullName TextInput
    const fullNameInputRef = useRef(null);

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
        // Code for selecting an image from gallery
    };

    const handleSaveProfile = async () => {
        // Code for saving the profile updates
    };

    const handleNameChange = (text) => {
        setFullName(text);
        if (text !== '') {
            setIsEditing(true); // Show save button if the name is being edited
        } else {
            setIsEditing(false);
        }
    };

    const handlePenPress = () => {
        if (fullNameInputRef.current) {
            fullNameInputRef.current.focus();
        }
    };

    // Function to handle showing the password reset form
    const handleChangePasswordClick = () => {
        setShowPasswordForm(true);
    };

    // Function to change password (Base Case: old password required)
    const handleChangePassword = async () => {
        const user = auth.currentUser;
        if (user && currentPassword && newPassword && currentPassword !== newPassword) {
            try {
                // Re-authenticate with the current password
                const credential = EmailAuthProvider.credential(user.email, currentPassword);
                await reauthenticateWithCredential(user, credential); // Reauthenticate user

                // Proceed to update password
                await updatePassword(user, newPassword);
                Alert.alert('Password updated successfully!');
                setCurrentPassword(''); // Clear fields
                setNewPassword('');
                setShowPasswordForm(false);
            } catch (error) {
                Alert.alert('Error updating password:', error.message);
            }
        } else {
            Alert.alert('Please ensure the current and new passwords are correct and different.');
        }
    };

    // Function to handle forgot password
    const handleForgotPassword = async () => {
        try {
            if (email) {
                // Send password reset email
                await sendPasswordResetEmail(auth, email);
                Alert.alert('Link to reset password sent to your email.');
            } else {
                Alert.alert('Please provide your registered email address.');
            }
        } catch (error) {
            Alert.alert('Error sending password reset email:', error.message);
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
                    ref={fullNameInputRef} // Set the ref to the TextInput
                    style={styles.inputWithIcon} // Adjusted for the full name with pen icon
                    placeholder="Full Name"
                    placeholderTextColor="#d3d3d3"
                    value={fullName}
                    onChangeText={handleNameChange}
                    editable={true}
                />
                <TouchableOpacity style={styles.penIconContainer} onPress={handlePenPress}>
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

            {!showPasswordForm ? (
                // Show the Change Password button initially
                <TouchableOpacity onPress={handleChangePasswordClick} style={styles.button}>
                    <Text style={styles.buttonText}>Change Password</Text>
                </TouchableOpacity>
            ) : (
                // Show the password reset options
                <>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Current Password"
                            placeholderTextColor="#d3d3d3"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!isPasswordVisible} // Toggle between showing/hiding password
                        />
                        <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                            <Image
                                source={require('../../assets/eye-open.png')} // Use the same icon to toggle between states
                                style={styles.eyeIcon}
                            />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            placeholderTextColor="#d3d3d3"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!isNewPasswordVisible} // Toggle between showing/hiding new password
                        />
                        <TouchableOpacity onPress={() => setIsNewPasswordVisible(!isNewPasswordVisible)}>
                            <Image
                                source={require('../../assets/eye-open.png')} // Use the same icon to toggle between states
                                style={styles.eyeIcon}
                            />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={handleChangePassword} style={styles.button}>
                        <Text style={styles.buttonText}>Change Password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleForgotPassword} style={styles.button}>
                        <Text style={styles.buttonText}>Forgot your password?</Text>
                    </TouchableOpacity>
                </>
            )}

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
        marginBottom: 0, // Ensures spacing between the full name and other boxes
    },
    inputWithIcon: {
        flex: 1,
        padding: 8,
        borderColor: '#fff', // White border to contrast with black background
        borderWidth: 1,
        borderRadius: 5,
        color: '#fff', // White text color for better visibility
        fontSize: 14,
        height: 40,
        marginBottom: 15, // Equal margin between all text boxes
    },
    input: {
        width: '100%', // Ensures the input field takes full width
        padding: 8,
        borderColor: '#fff', // White border
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 20, // Ensures equal spacing between all boxes
        color: '#fff', // White text color for better visibility
        fontSize: 14,
        height: 40,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    eyeIcon: {
        width: 15,
        height: 15,
        tintColor: '#fff', // Adjust the color of the eye icon
        marginLeft: -30, // Adjust the space between the input and the icon
        marginBottom: 20
    },
    penIconContainer: {
        padding: 0,
        position: 'absolute',
        right: 10, // Moves the pen to the right
        top: 10, // Moves the pen up slightly
    },
    penIcon: {
        width: 15, // Make the pen icon smaller
        height: 15,
        tintColor: '#fff', // White icon to contrast with black background
    },
    button: {
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10, // Ensures some space between buttons
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
