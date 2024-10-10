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
} from 'react-native';
import { firestore, auth } from '../../firebase/firebaseConfigs';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
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

const BottomRow = ({ days, renderDay }) => {
  return (
    <View style={styles.bottomRow}>
      {days.map((day) => renderDay(day))}
    </View>
  );
};

const MemoriesScreen = ({ navigateTo }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [signUpTimestamp, setSignUpTimestamp] = useState(null); // Correct state name

  const daysInMonth = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  useEffect(() => {
    fetchUserSignUpTimestamp(); // Fetch the user's sign-up date
    fetchPostsForMonth();
  }, [currentMonth]);

  // Fetch the user's sign-up date from Firebase
  const fetchUserSignUpTimestamp = async () => {
    try {
      const userId = auth.currentUser.uid;
      const userDocRef = doc(firestore, 'users', userId); // Reference to the user's document
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if signUpTimestamp exists, handle the case where it's missing
        if (userData.signUpTimestamp) {
          const signUpTimestamp = userData.signUpTimestamp;
          setSignUpTimestamp(new Date(signUpTimestamp.seconds * 1000)); // Convert Firebase timestamp to JS Date
        } else {
          console.error('signUpTimestamp is missing in the user document');
          // Optionally, set a default timestamp if signUpTimestamp is missing
          setSignUpTimestamp(new Date()); // Set to current date as a fallback
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
          postMap[postDate] = data.imageUris?.[0] || null; // Store the first image URI or null
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
const handlePrevMonth = () => {
  if (signUpTimestamp) {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (newMonth >= signUpTimestamp) {
      setCurrentMonth(newMonth);
    }
  }
};

const handleNextMonth = () => {
  const currentDate = new Date(); // Today's date
  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  // Ensure users can't go past the current month
  if (nextMonth <= currentDate) {
    setCurrentMonth(nextMonth);
  }
};

const renderNavigationArrows = () => {
  const currentDate = new Date(); // Today's date
  const isNextDisabled = currentMonth.getFullYear() === currentDate.getFullYear() && currentMonth.getMonth() === currentDate.getMonth();
  const isPrevDisabled = signUpTimestamp && currentMonth <= signUpTimestamp;

  return (
    <View style={styles.header}>
      {/* Previous month arrow */}
      <TouchableOpacity onPress={handlePrevMonth} disabled={isPrevDisabled}>
        <Text style={[styles.arrowText, isPrevDisabled && styles.disabledArrow]}>
          ‹
        </Text>
      </TouchableOpacity>

      {/* Current month text */}
      <Text style={styles.monthText}>
        {format(currentMonth, 'MMMM yyyy')}
      </Text>

      {/* Next month arrow */}
      <TouchableOpacity onPress={handleNextMonth} disabled={isNextDisabled}>
        <Text style={[styles.arrowText, isNextDisabled && styles.disabledArrow]}>
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );
};


  const renderDay = (day) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    const postImage = posts[formattedDate]; // Get the image for the day if exists

    return (
      <View key={formattedDate} style={styles.dayContainer}>
        <Text style={styles.dayText}>{day.getDate()}</Text>
        <View style={styles.imageSquareContainer}>
          {postImage ? (
            <Image source={{ uri: postImage }} style={styles.imageSquare} />
          ) : (
            <View style={styles.imagePlaceholder} /> // Empty space with a border if no post
          )}
        </View>
      </View>
    );
  };

  // Helper function to render the rows of the grid
  const renderCalendarRows = () => {
    const rows = [];
    let week = [];

    daysInMonth.forEach((day, index) => {
      week.push(day);

      // Push full rows (7 days)
      if ((index + 1) % 7 === 0) {
        rows.push(
          <View key={index} style={styles.weekRow}>
            {week.map((d) => renderDay(d))}
          </View>
        );
        week = [];
      }

      // Handle the last row that may have fewer than 7 days
      if (index === daysInMonth.length - 1 && week.length > 0) {
        rows.push(
          <BottomRow key={index} days={week} renderDay={renderDay} />
        );
      }
    });

    return rows;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          {/* Disable previous month button if it goes before sign-up date */}
          <TouchableOpacity onPress={handlePrevMonth} disabled={signUpTimestamp && currentMonth <= signUpTimestamp}>
            <Text style={[styles.arrowText, signUpTimestamp && currentMonth <= signUpTimestamp && styles.disabledArrow]}>
              ‹
            </Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={handleNextMonth}>
            <Text style={styles.arrowText}>›</Text>
          </TouchableOpacity>
        </View>
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
    </SafeAreaView>
  );
};

// Adjust the size for squares to fit 7 days in a row
const squareSize = width / 7 - 10; // Adjusted size for 7 squares per row
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
    color: 'gray', // Faded effect for disabled arrows
  },
  loadingText: {
    textAlign: 'center',
    color: '#fff',
  },
  scrollContent: {
    alignItems: 'center', // Center the scroll view content
  },
  gridContainer: {
    width: '100%',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Ensures even spacing between squares in a row
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // Left align the bottom row
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
    borderColor: 'white', // White border for the square
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

export default MemoriesScreen
