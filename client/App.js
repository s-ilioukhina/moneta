import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NewEntryPage from './NewEntryPage';

export default function App() {
  return (
    <NewEntryPage/>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
