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
import MyFriendCirclesScreen from './src/screens/MyFriendCirclesScreen';
import MyFlixScreen from './src/screens/MyFlixScreen';
import MyFlixExistingScreen from './src/screens/MyFlixExistingScreen';
import { auth, firestore } from './firebase/firebaseConfigs';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection, query, where, getDocs } from 'firebase/firestore';
import { ThemeProvider } from './src/contexts/ThemeContext';
import MyCirclesScreen from './src/screens/MyCirclesScreen';
import CircleDetailsScreen from './src/screens/CircleDetailsScreen';
import AccountSettings from './src/screens/AccountSettings';
import ReportBugs from './src/screens/ReportBugs';
import PrivacySettings from './src/screens/PrivacySettings';
import Support from './src/screens/Support';
import MyCirclesFeed from './src/screens/MyCirclesFeed';
import ContactUs from './src/screens/ContactUs';
import AppPermissionsScreen from './src/screens/AppPermissionsScreen';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('Main');
  const [screenParams, setScreenParams] = useState(null);
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
        friends: [],
        profilePicUri: ''
      });
      Alert.alert('Registration successful', `Welcome, ${user.email}`);
      setCurrentScreen('Home');
    } catch (error) {
      Alert.alert('Registration failed', error.message);
    }
  };

  const navigateTo = (screen, params = null) => {
    setCurrentScreen(screen);
    setScreenParams(params);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Main':
        return <MainScreen setCurrentScreen={setCurrentScreen} />;
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
        return <HomeScreen navigateTo={navigateTo} />;
      case 'MyFriends':
        return <MyFriendsScreen navigateTo={navigateTo} />;
      case 'Memories':
        return <MemoriesScreen navigateTo={navigateTo} />;
      case 'FriendCircles':
        return <MyFriendCirclesScreen navigateTo={navigateTo} />;
      case 'MyCirclesScreen':
        return <MyCirclesScreen navigateTo={navigateTo} />;
      case 'CircleDetails':
        return <CircleDetailsScreen route={{ params: screenParams }} navigateTo={navigateTo} />;
      case 'Settings':
        return <SettingsScreen navigateTo={navigateTo} />;
      case 'Help':
        return <HelpScreen navigateTo={navigateTo} />;
      case 'MyProfile':
        return <MyProfileScreen navigateTo={navigateTo} />;
      case 'MyFlix':
        return <MyFlixScreen navigateTo={navigateTo} />;
      case 'MyFlixExisting':
        return <MyFlixExistingScreen navigateTo={navigateTo} route={{ params: screenParams }} />;
      case 'ReportBugs':
        return <ReportBugs navigateTo={navigateTo} />;
      case 'PrivacySettings':
        return <PrivacySettings navigateTo={navigateTo} />;
      case 'AccountSettings':
        return <AccountSettings navigateTo={navigateTo} />;
      case 'Support':
        return <Support navigateTo={navigateTo} />;
      case 'ContactUs':
        return <ContactUs navigateTo={navigateTo} />;
      case 'MyCirclesFeed':
        return <MyCirclesFeed navigateTo={navigateTo} />;
      case 'AppPermissions':
        return <AppPermissionsScreen navigateTo={navigateTo}/>;
      default:
        return <MainScreen setCurrentScreen={setCurrentScreen} />;
    }
  };

  return (
    <ThemeProvider>
      {renderScreen()}
    </ThemeProvider>
  );
};

export default App;
