import * as React from 'react';
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import MainScreen from './src/screens/MainScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import MyFriendsScreen from './src/screens/MyFriendsScreen';
import MemoriesScreen from './src/screens/MemoriesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HelpScreen from './src/screens/HelpScreen';
import MyProfileScreen from './src/screens/MyProfileScreen';
import MyFlixScreen from './src/screens/MyFlixScreen';
import MyFlixExistingScreen from './src/screens/MyFlixExistingScreen'; // Import the new screen
import { auth, firestore } from './firebase/firebaseConfigs';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('Main');
  const [screenParams, setScreenParams] = useState(null); // To hold screen params
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');

  useEffect(() => {
    if (currentScreen === 'Main') {
      const timer = setTimeout(() => {
        setCurrentScreen('Login');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const handleLogin = async () => {
    try {
      // Check if the identifier is an email or username
      let email = loginIdentifier;
      if (!loginIdentifier.includes('@')) {
        const q = query(
          collection(firestore, 'users'),
          where('username', '==', loginIdentifier)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          email = querySnapshot.docs[0].data().email;
        } else {
          throw new Error('Invalid username or email');
        }
      }
      await signInWithEmailAndPassword(auth, email, loginPassword);
      setCurrentScreen('Home');
    } catch (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      const user = userCredential.user;
      await setDoc(doc(firestore, 'users', user.uid), {
        fullName: registerFullName,
        username: registerUsername,
        email: user.email,
        friends: [], // Initialize empty list of friends
        profilePicUri: "" // Initialize empty profile picture URI
      });
      Alert.alert('Registration successful', `Welcome, ${user.email}`);
      setCurrentScreen('Home'); // Navigate to HomeScreen after successful registration
    } catch (error) {
      Alert.alert('Registration failed', error.message);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Main':
        return <MainScreen />;
      case 'Login':
        return (
          <LoginScreen
            loginIdentifier={loginIdentifier}
            setLoginIdentifier={setLoginIdentifier}
            loginPassword={loginPassword}
            setLoginPassword={setLoginPassword}
            handleLogin={handleLogin}
            setCurrentScreen={setCurrentScreen}
          />
        );
      case 'Register':
        return (
          <RegisterScreen
            registerFullName={registerFullName}
            setRegisterFullName={setRegisterFullName}
            registerUsername={registerUsername}
            setRegisterUsername={setRegisterUsername}
            registerEmail={registerEmail}
            setRegisterEmail={setRegisterEmail}
            registerPassword={registerPassword}
            setRegisterPassword={setRegisterPassword}
            handleRegister={handleRegister}
            setCurrentScreen={setCurrentScreen}
          />
        );
      case 'Home':
        return <HomeScreen navigateTo={(screen, params) => { setCurrentScreen(screen); setScreenParams(params); }} />;
      case 'MyFriends':
        return <MyFriendsScreen navigateTo={setCurrentScreen} />;
      case 'Memories':
        return <MemoriesScreen navigateTo={setCurrentScreen} />;
      case 'Settings':
        return <SettingsScreen navigateTo={setCurrentScreen} />;
      case 'Help':
        return <HelpScreen navigateTo={setCurrentScreen} />;
      case 'MyProfile':
        return <MyProfileScreen navigateTo={setCurrentScreen} />;
      case 'MyFlix':
        return <MyFlixScreen navigateTo={setCurrentScreen} />;
      case 'MyFlixExisting': // Add new case for MyFlixExisting screen
        return <MyFlixExistingScreen navigateTo={setCurrentScreen} route={{ params: screenParams }} />;
      default:
        return <MainScreen />;
    }
  };

  return renderScreen();
};

export default App;
