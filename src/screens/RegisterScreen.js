import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { auth, firestore } from '../../firebase/firebaseConfigs';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const RegisterScreen = ({ setCurrentScreen }) => {
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [profileImageUri, setProfileImageUri] = useState(''); // Initialize as an empty string

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const user = userCredential.user;
  
      // Save user data to Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        fullName: registerFullName,
        username: registerUsername,
        email: registerEmail,
        profileImageUri: '', // Set initial profile image URI as empty string
        signUpTimeStamp: Timestamp.now(), // Store the current timestamp as the sign-up date
      });
  
      alert('Registration successful');
      setCurrentScreen('Login');
    } catch (error) {
      alert('Failed to register: ' + error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.text}>F  L  I  X</Text>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#FFFFFF"
          value={registerFullName}
          onChangeText={text => setRegisterFullName(text)}
          autoCapitalize="words"
          textContentType="name"
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#FFFFFF"
          value={registerUsername}
          onChangeText={text => setRegisterUsername(text)}
          autoCapitalize="none"
          textContentType="username"
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#FFFFFF"
          value={registerEmail}
          onChangeText={text => setRegisterEmail(text)}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#FFFFFF"
          secureTextEntry
          value={registerPassword}
          onChangeText={text => setRegisterPassword(text)}
          autoCapitalize="none"
          textContentType="newPassword"
        />
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          setRegisterFullName('');
          setRegisterUsername('');
          setRegisterEmail('');
          setRegisterPassword('');
          setCurrentScreen('Login');
        }}>
          <Text style={styles.signUpText}>
            Already have an account? <Text style={styles.signUpLink}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 60,
    letterSpacing: 3,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  input: {
    width: '80%',
    color: '#FFFFFF',
    fontSize: 18,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
    marginVertical: 10,
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 20,
    color: '#000000',
    fontWeight: 'bold',
  },
  signUpText: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 16,
  },
  signUpLink: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
  
  export default RegisterScreen;
