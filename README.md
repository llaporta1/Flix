
<img width="509" alt="Screenshot 2024-10-25 at 12 38 21 AM" src="https://github.com/user-attachments/assets/8d2c4b38-b20b-4827-8d4c-0643e3bb3a6a">


FLIX is a dynamic social media app that allows users to share 24-hour "photo dumps" with their friends. This app is designed to help users stay connected with their circles in a fun, easy-to-use platform that emphasizes casual social sharing. Built for iOS with JavaScript and React Native, FLIX offers features for discovering friends, syncing contacts, and sharing moments in a visually captivating way.


**Features**

24-Hour Photo Dumps: Users can upload a set of photos ("photo dump") that disappears after 24 hours.

Friend Discovery: Easily find friends online and connect with new contacts synced from your phone's address book.

Contact Syncing: Automatically sync contacts from your device using React Native's Contacts library.

Custom Friend Circles: Create unique friend circles and share your "photo dumps" with different groups.

Real-Time Data Management: Backend powered by Firebase Firestore for fast and scalable user data management.

User Authentication: Secure authentication with Firebase Authentication, ensuring a smooth and safe sign-in process.

Image Handling: Efficiently manage image uploads and storage with Firebase Cloud Storage.

**Usage**

Install FLIX from the App Store.

Sign up with your email and password, or log in if you already have an account.

Upload a set of photos as your daily "photo dump" to share with friends.

Discover and sync your friends using your phone contacts, or search for friends online.

Create unique friend circles and share specific "photo dumps" with different groups.

Receive notifications when friends post or when your current photos expire.

**Tech Stack**

Frontend:

React Native: Used for building the user interface and ensuring cross-platform mobile compatibility.
JavaScript: Main language used for development.
React Native Libraries: Utilized libraries such as:
Image Picker: For selecting and uploading images.
Contacts: For syncing contacts from the user’s phone.
Firebase Messaging: For sending notifications.

Backend:

Firebase Firestore: Real-time database for user data management and storing app-related information.
Firebase Authentication: Used for secure user authentication and login.
Firebase Cloud Storage: To efficiently store and manage user-uploaded images.
Push Notifications: Integrated with Firebase Cloud Messaging to notify users when friends post or when their posts are expiring.
Installation (for developers)

**Clone the repository:**
bash
Copy code
git clone https://github.com/yourusername/FLIX.git
Install dependencies:
bash
Copy code
npm install
Run the app on an iOS device or simulator:
bash
Copy code
npx react-native run-ios
License

This project is licensed under the MIT License - see the LICENSE file for details.
