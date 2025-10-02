import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {useSelector} from 'react-redux';
import {webSocketTestService} from '../services/websocket-test';
import {useVerificationStatus} from '../hooks/useVerificationStatus';
import VerificationStatusBadge from '../components/VerificationStatusBadge';
import {useTranslation} from 'react-i18next';
import {notifyInfo} from '../services/notify';

const WebSocketTest = ({navigation}) => {
  const {t} = useTranslation();
  const websocketState = useSelector(state => state.websocket);
  const auth = useSelector(state => state.auth);
  const {
    verificationStatus,
    lastUpdate,
    getVerificationStatusLabel,
    isVerificationApproved,
    isVerificationRejected,
    isVerificationPending,
  } = useVerificationStatus();

  const handleTestRejected = () => {
    webSocketTestService.sendTestVerificationRejected();
  };

  const handleTestApproved = () => {
    webSocketTestService.sendTestVerificationApproved();
  };

  const handleTestLicenseUpload = () => {
    console.log('Testing license upload notification...');
    console.log(
      'Current verification status before upload:',
      verificationStatus,
    );
    webSocketTestService.handleUserNotification({
      type: 'license_uploaded',
      title: 'License Uploaded',
      message:
        'Your license has been successfully uploaded and sent for review.',
      data: {
        user_id: auth.userData?.id,
        license_file_path: '/storage/licenses/test.pdf',
        verification_status: 0, // Should reset to "Under Review"
        old_status: verificationStatus, // Pass current status as old
        uploaded_at: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  };

  const handleInitializeWebSocket = () => {
    const wsConfig = {
      key: 'test-key',
      cluster: 'test',
      baseURL: 'http://localhost',
      token: auth.token,
    };
    webSocketTestService.initialize(wsConfig);
  };

  const handleDisconnectWebSocket = () => {
    webSocketTestService.disconnect();
  };

  const handleTestBasicNotification = () => {
    console.log('Testing basic notification...');
    notifyInfo(
      'Test Notification',
      'This is a simple test notification to check the system',
    );
  };

  const handleTestDirectWarning = () => {
    console.log('Testing direct warning notification...');
    const {notifyWarning} = require('../services/notify');
    notifyWarning(
      'Direct Warning',
      'This is a direct warning, bypassing WebSocket',
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>WebSocket Test</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.label}>WebSocket:</Text>
            <Text
              style={[
                styles.status,
                {color: websocketState.isConnected ? '#28A745' : '#DC3545'},
              ]}>
              {websocketState.isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Notifications:</Text>
            <Text style={styles.value}>{websocketState.notificationCount}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Verification Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Status:</Text>
            <VerificationStatusBadge />
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Value:</Text>
            <Text style={styles.value}>
              {verificationStatus} ({getVerificationStatusLabel()})
            </Text>
          </View>
          {lastUpdate && (
            <View style={styles.statusRow}>
              <Text style={styles.label}>Last Update:</Text>
              <Text style={styles.value}>
                {new Date(lastUpdate.timestamp).toLocaleString()}
              </Text>
            </View>
          )}
          {lastUpdate?.comment && (
            <View style={styles.statusRow}>
              <Text style={styles.label}>Comment:</Text>
              <Text style={styles.value}>{lastUpdate.comment}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Management</Text>

          <TouchableOpacity
            style={[styles.testButton, styles.connectButton]}
            onPress={handleInitializeWebSocket}>
            <Text style={styles.testButtonText}>Connect WebSocket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.disconnectButton]}
            onPress={handleDisconnectWebSocket}>
            <Text style={styles.testButtonText}>Disconnect WebSocket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.uploadButton]}
            onPress={handleTestBasicNotification}>
            <Text style={styles.testButtonText}>Test: Basic Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.rejectButton]}
            onPress={handleTestDirectWarning}>
            <Text style={styles.testButtonText}>Test: Direct Warning</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Notifications</Text>

          <TouchableOpacity
            style={[styles.testButton, styles.rejectButton]}
            onPress={handleTestRejected}>
            <Text style={styles.testButtonText}>
              Test: Verification Rejected
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.approveButton]}
            onPress={handleTestApproved}>
            <Text style={styles.testButtonText}>
              Test: Verification Approved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.uploadButton]}
            onPress={handleTestLicenseUpload}>
            <Text style={styles.testButtonText}>Test: License Uploaded</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Data</Text>
          <View style={styles.statusRow}>
            <Text style={styles.label}>ID:</Text>
            <Text style={styles.value}>{auth.userData?.id}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{auth.userData?.name}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{auth.userData?.email}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.label}>Type:</Text>
            <Text style={styles.value}>{auth.userData?.type}</Text>
          </View>
        </View>

        {websocketState.lastVerificationUpdate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Last Update</Text>
            <Text style={styles.jsonText}>
              {JSON.stringify(websocketState.lastVerificationUpdate, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 2,
    textAlign: 'right',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 2,
    textAlign: 'right',
  },
  testButton: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#DC3545',
  },
  approveButton: {
    backgroundColor: '#28A745',
  },
  uploadButton: {
    backgroundColor: '#007AFF',
  },
  connectButton: {
    backgroundColor: '#28A745',
  },
  disconnectButton: {
    backgroundColor: '#6C757D',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  jsonText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
  },
});

export default WebSocketTest;
