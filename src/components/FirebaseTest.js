import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

const FirebaseTest = () => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('Checking authentication...');

  // Test authentication
  const testAuth = async () => {
    try {
      setStatus('Signing in...');
      // Use a test account or replace with your test credentials
      const testEmail = 'test@example.com';
      const testPassword = 'test1234';
      
      // Try to sign in
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      setUser(userCredential.user);
      setStatus('Successfully signed in!');
      
      // Sign out after 3 seconds
      setTimeout(async () => {
        await signOut(auth);
        setUser(null);
        setStatus('Signed out successfully');
      }, 3000);
      
    } catch (error) {
      console.error('Auth test error:', error);
      setStatus(`Error: ${error.message}`);
    }
  };

  // Check auth state on component mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe; // Unsubscribe on unmount
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>
      <Text style={styles.userInfo}>
        {user ? `User: ${user.email}` : 'No user signed in'}
      </Text>
      <Button 
        title="Test Authentication" 
        onPress={testAuth}
        disabled={!!user}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  statusLabel: {
    fontWeight: 'bold',
    marginRight: 10,
  },
  statusText: {
    flex: 1,
    color: '#333',
  },
  userInfo: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
});

export default FirebaseTest;
