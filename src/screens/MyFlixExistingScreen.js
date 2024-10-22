import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, Dimensions, TouchableOpacity, Alert, FlatList } from 'react-native';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import { doc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const MyFlixExistingScreen = ({ route, navigateTo }) => {
  const [comments, setComments] = useState([]);
  const [reactions, setReactions] = useState({});
  const post = route?.params?.post;

  useEffect(() => {
    if (post) {
      fetchPostDetails();
    }
  }, [post]);

  const fetchPostDetails = async () => {
    try {
      // Fetch comments for the post
      const commentsQuery = query(collection(firestore, 'comments'), where('postId', '==', post.id));
      const commentsSnapshot = await getDocs(commentsQuery);
      const fetchedComments = commentsSnapshot.docs.map((doc) => doc.data());
      setComments(fetchedComments);

      // Fetch reactions for the post
      const reactionsQuery = query(collection(firestore, 'reactions'), where('postId', '==', post.id));
      const reactionsSnapshot = await getDocs(reactionsQuery);
      const fetchedReactions = reactionsSnapshot.docs.map((doc) => doc.data());

      // Process fetched reactions into a format for display
      const reactionCount = {};
      fetchedReactions.forEach((reaction) => {
        reactionCount[reaction.reaction] = (reactionCount[reaction.reaction] || 0) + 1;
      });
      setReactions(reactionCount);
    } catch (error) {
      console.error('Error fetching post details: ', error);
    }
  };

  const handleDeletePost = async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete your post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'posts', post.id));
              Alert.alert('Post Deleted', 'Your post has been successfully deleted.');
              navigateTo('MyFlix'); // Navigate back to the post creation screen
            } catch (error) {
              console.error('Error deleting post: ', error);
              Alert.alert('Error', 'Failed to delete the post. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderCommentItem = ({ item }) => (
    <View style={styles.commentContainer}>
      <Text style={styles.commentUsername}>{item.username}</Text>
      <Text style={styles.commentText}>{item.comment}</Text>
    </View>
  );

  const renderReactions = () => (
    <View style={styles.reactionsContainer}>
      {Object.entries(reactions).map(([reaction, count]) => (
        <Text key={reaction} style={styles.reactionText}>
          {reaction}: {count}
        </Text>
      ))}
    </View>
  );

  const now = new Date();
  const postTime = post?.timestamp?.toDate();
  const timeDifference = postTime ? (now - postTime) / (1000 * 60 * 60) : 0; // Difference in hours
  const hoursLeft = 24 - timeDifference;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => navigateTo('Home')}>
        <Text style={styles.closeButtonText}>X</Text>
      </TouchableOpacity>

      {post ? (
        <View style={styles.inner}>
          <Text style={styles.text}>MY FLIX</Text>
          <Image source={{ uri: post.imageUri }} style={styles.postImage} />
          <Text style={styles.postCaption}>{post.caption}</Text>
          <Text style={styles.timeLeftText}>
            You can post again in {hoursLeft.toFixed(1)} hours
          </Text>

          {/* Show reactions */}
          <Text style={styles.subheading}>Reactions:</Text>
          {renderReactions()}

          {/* Show comments */}
          <Text style={styles.subheading}>Comments:</Text>
          <FlatList
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.commentsList}
          />

          {/* Delete Post Button */}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost}>
            <Text style={styles.deleteButtonText}>Delete Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.errorText}>No post found.</Text>
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inner: {
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 20,
  },
  postImage: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 20,
  },
  postCaption: {
    fontSize: 18,
    marginBottom: 10,
  },
  timeLeftText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  reactionsContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  reactionText: {
    fontSize: 16,
  },
  commentsList: {
    width: '90%',
    maxHeight: 150,
    marginTop: 10,
  },
  commentContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  commentUsername: {
    fontWeight: 'bold',
  },
  commentText: {
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderRadius: 30,
    marginTop: 20,
    marginBottom: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
  },
});

export default MyFlixExistingScreen;
