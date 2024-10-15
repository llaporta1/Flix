import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, Image, Dimensions, Animated } from 'react-native';

const MainScreen = ({ setCurrentScreen }) => {
  const [fadeAnim] = useState(new Animated.Value(1)); // Fade animation for the images
  const [textFadeAnim] = useState(new Animated.Value(0)); // Fade animation for the text
  const [textPosition] = useState(new Animated.Value(0)); // Position animation for FLIX text

  const { width, height } = Dimensions.get('window');
  const gridSize = 2; // Reduced grid size
  const imageSize = Math.max(width, height) / (gridSize - 0.5);

  useEffect(() => {
    // Fade out the images and fade in the FLIX letters
    Animated.timing(fadeAnim, {
      toValue: 0, // Images will fade out
      duration: 4000,
      useNativeDriver: true,
    }).start();

    // Fade in the FLIX letters
    Animated.timing(textFadeAnim, {
      toValue: 1, // Letters fade in
      duration: 4000,
      useNativeDriver: true,
    }).start();

    // Animate FLIX text floating up
    Animated.timing(textPosition, {
      toValue: -100, // Adjust this value to control how far the text moves up
      duration: 2000,
      delay: 3000, // Delay for when the collage fades out
      useNativeDriver: true,
    }).start(() => {
      // After text animation, navigate to LoginScreen by changing state
      setCurrentScreen('Login');
    });

    return () => clearTimeout();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Grid of images */}
      <Animated.View style={[styles.gridContainer, { opacity: fadeAnim }]}>
        {Array.from({ length: gridSize * gridSize }).map((_, i) => (
          <View key={i} style={styles.image}>
            <Image
              source={require('../../assets/images.jpg')} // Your collage image
              style={{
                width: imageSize,
                height: imageSize,
              }}
              resizeMode="cover"
            />
          </View>
        ))}
      </Animated.View>

      {/* FLIX letters fade in */}
      <Animated.View style={[styles.textContainer, { opacity: textFadeAnim, transform: [{ translateY: textPosition }] }]}>
        <Text style={styles.text}>F  L  I  X</Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  image: {
    position: 'relative',
  },
  textContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 60,
    letterSpacing: 5,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default MainScreen;
