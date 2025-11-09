import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { auth, db } from '../../../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseTestScreen = () => {
  const [status, setStatus] = useState('Checking Firebase connection...');
  const [firestoreStatus, setFirestoreStatus] = useState('Checking Firestore...');
  const [authStatus, setAuthStatus] = useState('Checking Auth...');
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const testConnections = async () => {
      try {
        // Test Firebase Auth
        setAuthStatus('Checking authentication state...');
        const currentUser = auth.currentUser;
        setUser(currentUser);
        
        // Test Firestore connection
        setFirestoreStatus('Connecting to Firestore...');
        const testCollection = collection(db, 'test');
        await getDocs(testCollection);
        setFirestoreStatus('✅ Firestore connected successfully');
        
        setStatus('✅ Firebase is connected and working!');
      } catch (error) {
        console.error('Test error:', error);
        setStatus(`❌ Error: ${error.message}`);
        if (error.message.includes('Firestore')) {
          setFirestoreStatus(`❌ Firestore error: ${error.message}`);
        } else {
          setAuthStatus(`❌ Auth error: ${error.message}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    testConnections();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Firebase Connection Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Connection Status:</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Text style={styles.statusText}>{status}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication</Text>
        <Text style={styles.sectionText}>
          {user ? `✅ User is logged in: ${user.email || 'Anonymous'}` : '❌ No user logged in'}
        </Text>
        <Text style={styles.sectionText}>{authStatus}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Firestore</Text>
        <Text style={styles.sectionText}>{firestoreStatus}</Text>
      </View>

      <View style={styles.notes}>
        <Text style={styles.notesTitle}>Notes:</Text>
        <Text style={styles.notesText}>
          • If you see errors, check your Firebase configuration in the .env file
        </Text>
        <Text style={styles.notesText}>
          • Make sure you've enabled the required services in Firebase Console
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50',
  },
  statusText: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#2c3e50',
  },
  sectionText: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 5,
  },
  notes: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#e65100',
  },
  notesText: {
    fontSize: 14,
    color: '#5d4037',
    marginBottom: 5,
  },
});

export default FirebaseTestScreen;
