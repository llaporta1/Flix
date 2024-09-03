import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';  // Import Firebase Storage

// import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration (iOS key)
const firebaseConfig = {
  apiKey: "AIzaSyBtjTy56MlbVBXuZ-nGFjxbuWyb4hysWWo", // Replace with the actual iOS API key
  authDomain: "moodscape-592de.firebaseapp.com",
  projectId: "moodscape-592de",
  storageBucket: "moodscape-592de.appspot.com",
  messagingSenderId: "923938596144",
  appId: "1:923938596144:ios:b3aa74919b9ecd2b0194f5"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // if already initialized, use that one
}

// Initialize Firebase Authentication and Firestore
const auth = initializeAuth(app);
// console.log(reactNativeAsyncStorage);
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(ReactNativeAsyncStorage)
// });
const firestore = getFirestore(app);
const storage = getStorage(app);

export { firebaseConfig, auth, firestore, storage };