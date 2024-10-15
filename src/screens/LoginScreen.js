import React from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const LoginScreen = ({ loginIdentifier, setLoginIdentifier, loginPassword, setLoginPassword, handleLogin, setCurrentScreen }) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.inner}>
      {/* The same FLIX text as the MainScreen */}
      <Text style={styles.text}>F  L  I  X</Text>
      <TextInput
        style={styles.input}
        placeholder="Email or Username"
        placeholderTextColor="#FFFFFF"
        value={loginIdentifier}
        onChangeText={text => setLoginIdentifier(text)}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#FFFFFF"
        secureTextEntry
        value={loginPassword}
        onChangeText={text => setLoginPassword(text)}
        autoCapitalize="none"
        textContentType="password"
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log in</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {
        setLoginIdentifier('');
        setLoginPassword('');
        setCurrentScreen('Register');
      }}>
        <Text style={styles.signUpText}>
          New to Flix? <Text style={styles.signUpLink}>Sign Up Now</Text>
        </Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 60,
    letterSpacing: 5, // Keep the same spacing as MainScreen
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 20,
    color: '#013220',
    fontWeight: 'bold',
  },
  input: {
    width: '80%',
    color: '#FFFFFF',
    fontSize: 18,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
    marginVertical: 10,
  },
  signUpText: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 16,
  },
  signUpLink: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
