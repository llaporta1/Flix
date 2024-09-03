// src/screens/SettingsScreen.js
import React from 'react';
import { SafeAreaView, View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext'; // Import useTheme hook
import Menu from '../components/Menu';

const SettingsScreen = ({ navigateTo }) => {
  const { theme, toggleTheme } = useTheme(); // Use theme context

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Menu navigateTo={navigateTo} />
      <View style={styles.contentContainer}>
        <Text style={[styles.headerText, { color: theme.textColor }]}>Settings</Text>
        <View style={styles.optionContainer}>
          <Text style={[styles.optionText, { color: theme.textColor }]}>Dark Mode</Text>
          <Switch
            value={theme === darkTheme}
            onValueChange={toggleTheme}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  optionText: {
    fontSize: 18,
  },
});

export default SettingsScreen;
