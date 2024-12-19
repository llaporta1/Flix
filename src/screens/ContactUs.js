import { StyleSheet, Text, View, SafeAreaView, Linking, Pressable, TouchableOpacity, Image } from 'react-native';
import React from 'react';

const developers = [
    { name: 'Lauren LaPorta', role: 'Front and Back-End Developer', email: 'asj7gw@virginia.edu' },
];

export default function ContactUs({ navigateTo }) {
    const handleGoBack = () => {
        navigateTo('Settings'); // Navigate back to the SettingsScreen
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Back Arrow using the image from assets */}
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
                <Image source={require('../../assets/back-arrow.png')} style={styles.backArrowImage} />
            </TouchableOpacity>

            <Text style={styles.title}>
                Contact Us
            </Text>

            <Text style={styles.subtitle}>
                Developers
            </Text>

            {developers.map((developer, index) => (
                <View key={index} style={styles.developerContainer}>
                    <Text style={styles.name}>
                        {developer.name}
                    </Text>
                    <Text style={styles.role}>
                        {developer.role}
                    </Text>
                    <Pressable onPress={() => Linking.openURL(`mailto:${developer.email}`)}>
                        <Text style={styles.email}>
                            {developer.email}
                        </Text>
                    </Pressable>
                </View>
            ))}

            {/* General questions section */}
            <Text style={styles.generalSection}>
                For general inquiries, please contact us at:
            </Text>

            <Pressable onPress={() => Linking.openURL('mailto:asj7gw@virginia.edu')}>
                <Text style={styles.generalEmail}>
                    asj7gw@virginia.edu
                </Text>
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#000',  // Black background for dark mode
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 10,
        zIndex: 1,
    },
    backArrowImage: {
        width: 24,  // Adjust the size as needed
        height: 24,
        tintColor: 'white', // Optional: ensures the image adapts to dark mode
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',  // White text for dark mode
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#4CAF50',  // Green for subtitles
        marginBottom: 15,
    },
    developerContainer: {
        marginBottom: 15,
        alignItems: 'center',
        padding: 20,
        borderRadius: 10,
        backgroundColor: '#1c1c1c',  // Dark gray container background
        width: '80%',
    },
    name: {
        fontSize: 18,
        fontWeight: '500',
        color: '#fff',  // White text for names
        marginBottom: 5,
    },
    role: {
        fontSize: 16,
        color: '#bbb',  // Lighter gray for role
        marginBottom: 10,
    },
    email: {
        fontSize: 16,
        color: '#007AFF',  // Blue for email links
        textDecorationLine: 'underline',
    },
    generalSection: {
        fontSize: 18,
        color: '#fff',  // White text for the general section
        marginTop: 30,
    },
    generalEmail: {
        fontSize: 16,
        color: '#007AFF',  // Blue for email links
        textDecorationLine: 'underline',
    },
});
