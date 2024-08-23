import React from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const RegisterScreen = ({
  registerUsername,
  setRegisterUsername,
  registerEmail,
  setRegisterEmail,
  registerPassword,
  setRegisterPassword,
  registerFullName,
  setRegisterFullName,
  handleRegister,
  setCurrentScreen,
}) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.inner}>
      <Text style={styles.text}>F  L  I  X</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#D2B48C"
        value={registerFullName}
        onChangeText={text => setRegisterFullName(text)}
        autoCapitalize="words"
        textContentType="name"
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#D2B48C"
        value={registerUsername}
        onChangeText={text => setRegisterUsername(text)}
        autoCapitalize="none"
        textContentType="username"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#D2B48C"
        value={registerEmail}
        onChangeText={text => setRegisterEmail(text)}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#D2B48C"
        secureTextEntry
        value={registerPassword}
        onChangeText={text => setRegisterPassword(text)}
        autoCapitalize="none"
        textContentType="newPassword"
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {
        setRegisterFullName('');
        setRegisterUsername('');
        setRegisterEmail('');
        setRegisterPassword('');
        setCurrentScreen('Login');
      }}>
        <Text style={styles.signUpText}>
          Already have an account? <Text style={styles.signUpLink}>Log in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#013220',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 60,
    color: '#D2B48C',
    fontWeight: 'bold',
  },
  input: {
    width: '80%',
    color: '#D2B48C',
    fontSize: 18,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#D2B48C',
    marginVertical: 10,
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#D2B48C',
    borderRadius: 5,
  },
  buttonText: {
    fontSize: 20,
    color: '#013220',
    fontWeight: 'bold',
  },
  signUpText: {
    marginTop: 20,
    color: '#D2B48C',
    fontSize: 16,
  },
  signUpLink: {
    color: '#D2B48C',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default RegisterScreen;
