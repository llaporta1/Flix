import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

const MainScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.inner}>
      <Text style={styles.text}>F  L  I  X</Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#013220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 60,
    color: '#D2B48C',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MainScreen;
