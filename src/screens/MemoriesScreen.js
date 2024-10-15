import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { firestore, auth, storage } from '../../firebase/firebaseConfigs'; // Added storage import
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage'; // Added Firebase storage method
import { format } from 'date-fns';
import Menu from '../components/Menu';

const { width } = Dimensions.get('window');

// Helper function to get the days in the month
const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const BottomRow = ({ days, renderDay }) => (
  <View style={styles.bottomRow}>
    {days.map((day) => renderDay(day))}
  </View>
);

const MemoriesScreen = ({ navigateTo }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [signUpTimestamp, setSignUpTimestamp] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [profileImages, setProfileImages] = useState({});

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  useEffect(() => {
    fetchUserSignUpTimestamp();
    fetchPostsForMonth();
  }, [currentMonth]);

  const fetchUserSignUpTimestamp = async () => {
    try {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.signUpTimestamp) {
          const signUpTimestamp = userData.signUpTimestamp;
          setSignUpTimestamp(new Date(signUpTimestamp.seconds * 1000));
        } else {
          console.error('signUpTimestamp is missing in the user document');
          setSignUpTimestamp(new Date());
        }
      } else {
        console.error('User document does not exist');
      }
    } catch (err) {
      console.error('Error fetching sign-up date:', err);
    }
  };

  const fetchPostsForMonth = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser.uid;
      const postsRef = collection(firestore, 'posts');
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const postsQuery = query(
        postsRef,
        where('userId', '==', userId),
        where('timestamp', '>=', startOfMonth),
        where('timestamp', '<=', endOfMonth)
      );

      const unsubscribe = onSnapshot(postsQuery, (querySnapshot) => {
        const postMap = {};
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const postDate = format(new Date(data.timestamp.seconds * 1000), 'yyyy-MM-dd');
          postMap[postDate] = data;
        });
        setPosts(postMap);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error fetching posts:', err);
      setLoading(false);
    }
  };

  // Fetch the user's profile image from Firebase Storage
  const fetchUserProfileImage = async (userId) => {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.profileImageUri) {
          setProfileImages((prev) => ({ ...prev, [userId]: userData.profileImageUri })); // Use the stored URL
        } else {
          console.error('No profile image found for user:', userId);
          setProfileImages((prev) => ({ ...prev, [userId]: null }));
        }
      }
    } catch (error) {
      console.error('Error fetching profile image:', error);
      setProfileImages((prev) => ({ ...prev, [userId]: null }));
    }
  };
  

  const handleDayClick = (day) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    const postData = posts[formattedDate];

    if (postData) {
      setSelectedPost(postData);
      setIsModalVisible(true);
      setCurrentImageIndex(0);

      // Fetch the profile image for the post's user if not already fetched
      if (!profileImages[postData.userId]) {
        fetchUserProfileImage(postData.userId);
      }
    }
  };

  const renderPostModal = () => {
    if (!selectedPost) return null;

    const handleNextImage = () => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % selectedPost.imageUris.length);
    };

    const handlePrevImage = () => {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + selectedPost.imageUris.length) % selectedPost.imageUris.length);
    };

    return (
      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeIcon} onPress={() => setIsModalVisible(false)}>
            <Text style={styles.closeIconText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.carouselContainer}>
            {selectedPost.imageUris.length > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <TouchableOpacity style={styles.arrowLeft} onPress={handlePrevImage}>
                    <Text style={styles.arrowText}>‹</Text>
                  </TouchableOpacity>
                )}
                {currentImageIndex < selectedPost.imageUris.length - 1 && (
                  <TouchableOpacity style={styles.arrowRight} onPress={handleNextImage}>
                    <Text style={styles.arrowText}>›</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            <Image
              source={{ uri: selectedPost.imageUris[currentImageIndex] }}
              style={styles.postImageModal}
              resizeMode="cover"
            />
          </View>

          <View style={styles.postDetailsRow}>
            <Image
              source={profileImages[selectedPost.userId] ? { uri: profileImages[selectedPost.userId] } : require('../../assets/profile-placeholder.png')}
              style={styles.profileImageSmall}
            />
            <View style={styles.postDetails}>
              <Text style={styles.username}>{selectedPost.username}</Text>
              {selectedPost.caption ? <Text style={styles.caption}>{selectedPost.caption}</Text> : null}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const handlePrevMonth = () => {
    if (signUpTimestamp) {
      const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      if (newMonth >= signUpTimestamp) {
        setCurrentMonth(newMonth);
      }
    }
  };

  const handleNextMonth = () => {
    const currentDate = new Date();
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

    if (nextMonth <= currentDate) {
      setCurrentMonth(nextMonth);
    }
  };

  const renderNavigationArrows = () => {
    const currentDate = new Date();
    const isNextDisabled = currentMonth.getFullYear() === currentDate.getFullYear() && currentMonth.getMonth() === currentDate.getMonth();
    const isPrevDisabled = signUpTimestamp && currentMonth <= signUpTimestamp;

    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevMonth} disabled={isPrevDisabled}>
          <Text style={[styles.arrowText, isPrevDisabled && styles.disabledArrow]}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity onPress={handleNextMonth} disabled={isNextDisabled}>
          <Text style={[styles.arrowText, isNextDisabled && styles.disabledArrow]}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCalendarRows = () => {
    const rows = [];
    let week = [];

    daysInMonth.forEach((day, index) => {
      week.push(day);

      if ((index + 1) % 7 === 0) {
        rows.push(
          <View key={index} style={styles.weekRow}>
            {week.map((d) => renderDay(d))}
          </View>
        );
        week = [];
      }

      if (index === daysInMonth.length - 1 && week.length > 0) {
        rows.push(<BottomRow key={index} days={week} renderDay={renderDay} />);
      }
    });

    return rows;
  };

  const renderDay = (day) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    const postImage = posts[formattedDate]?.imageUris?.[0];

    return (
      <TouchableOpacity key={formattedDate} style={styles.dayContainer} onPress={() => handleDayClick(day)}>
        <Text style={styles.dayText}>{day.getDate()}</Text>
        <View style={styles.imageSquareContainer}>
          {postImage ? (
            <Image source={{ uri: postImage }} style={styles.imageSquare} />
          ) : (
            <View style={styles.imagePlaceholder} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        {renderNavigationArrows()}
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.gridContainer}>
              {renderCalendarRows()}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Modal to display the selected post */}
      {renderPostModal()}
    </SafeAreaView>
  );
};

const squareSize = width / 7 - 10;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 70,
  },
  monthText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  arrowText: {
    color: 'white',
    fontSize: 24,
  },
  disabledArrow: {
    color: 'gray',
  },
  loadingText: {
    textAlign: 'center',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  closeIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  closeIconText: {
    fontSize: 30,
    color: '#fff',
  },
  postDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  profileImageSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ccc',
  },
  postDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    color: '#ccc',
  },
  carouselContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  postImageModal: {
    width: width - 60,
    height: width * 0.8,
    borderRadius: 10,
  },
  arrowLeft: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    zIndex: 1,
  },
  arrowRight: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    zIndex: 1,
  },
  arrowText: {
    color: '#fff',
    fontSize: 30,
  },
  scrollContent: {
    alignItems: 'center',
  },
  gridContainer: {
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  dayContainer: {
    width: squareSize,
    marginBottom: 10,
    alignItems: 'center',
  },
  dayText: {
    color: 'white',
    marginBottom: 5,
  },
  imageSquareContainer: {
    width: squareSize,
    height: squareSize,
    borderColor: 'white',
    borderWidth: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSquare: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
  },
});

export default MemoriesScreen;
