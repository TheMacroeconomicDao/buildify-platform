import React from 'react';
import {View, Text, Button, StyleSheet} from 'react-native';



const ErrorFallback = ({error, resetError}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong!</Text>
      <Text style={styles.errorText}>{error.toString()}</Text>
      <Button title="Try again" onPress={resetError} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
  },
});

export default ErrorFallback;