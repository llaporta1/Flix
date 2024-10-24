const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Function to send notifications on friend request creation
exports.sendFriendRequestNotification = functions.firestore
  .document('friendRequests/{requestId}')
  .onCreate(async (snapshot, context) => {
    const requestData = snapshot.data();
    const receiverId = requestData.receiverId;

    // Get the FCM token of the receiver (the user who is receiving the friend request)
    const userDoc = await admin.firestore().collection('users').doc(receiverId).get();
    const fcmToken = userDoc.data().fcmToken;

    if (fcmToken) {
      const payload = {
        notification: {
          title: 'New Friend Request!',
          body: `${requestData.senderUsername} sent you a friend request.`,
          sound: 'default',
        },
        token: fcmToken,
      };

      try {
        await admin.messaging().send(payload);
        console.log('Friend request notification sent successfully');
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  });
