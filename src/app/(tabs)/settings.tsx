import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { AI_API_KEY_STORAGE, ANTHROPIC_MODEL } from '@/utils/ai';
import { theme } from '@/constants/theme';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const loadKey = useCallback(async () => {
    const stored = await SecureStore.getItemAsync(AI_API_KEY_STORAGE);
    setHasStoredKey(!!stored);
    if (stored && !showInput) setApiKey('');
  }, [showInput]);

  useFocusEffect(
    useCallback(() => {
      void loadKey();
    }, [loadKey])
  );

  const saveKey = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      Alert.alert('API key required', 'Enter a valid Anthropic API key.');
      return;
    }
    await SecureStore.setItemAsync(AI_API_KEY_STORAGE, trimmed);
    setApiKey('');
    setShowInput(false);
    setHasStoredKey(true);
    Alert.alert('Saved', 'API key stored securely.');
  };

  const clearKey = async () => {
    await SecureStore.deleteItemAsync(AI_API_KEY_STORAGE);
    setHasStoredKey(false);
    setApiKey('');
    Alert.alert('Removed', 'API key deleted.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Anthropic API key</Text>
        <Text style={styles.cardSub}>
          Used for AI explanations on snippet details. Model: {ANTHROPIC_MODEL}
        </Text>

        {hasStoredKey && !showInput ? (
          <View style={styles.statusRow}>
            <Text style={styles.status}>Key saved (sk-••••••••)</Text>
            <TouchableOpacity onPress={() => setShowInput(true)}>
              <Text style={styles.link}>Update</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            placeholder="sk-ant-..."
            placeholderTextColor={theme.textTertiary}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}

        <View style={styles.actions}>
          {(showInput || !hasStoredKey) && (
            <TouchableOpacity style={styles.primaryBtn} onPress={saveKey}>
              <Text style={styles.primaryBtnText}>Save API key</Text>
            </TouchableOpacity>
          )}
          {hasStoredKey && (
            <TouchableOpacity style={styles.dangerBtn} onPress={clearKey}>
              <Text style={styles.dangerBtnText}>Remove key</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bgPrimary, padding: 16 },
  header: { fontSize: 24, fontWeight: '600', color: theme.textPrimary, marginBottom: 20 },
  card: {
    backgroundColor: theme.bgSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: theme.borderTertiary,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary, marginBottom: 4 },
  cardSub: { fontSize: 13, color: theme.textSecondary, marginBottom: 12, lineHeight: 18 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  status: { fontSize: 14, color: theme.textSecondary },
  link: { fontSize: 14, color: theme.textInfo, fontWeight: '600' },
  input: {
    backgroundColor: theme.bgPrimary,
    borderWidth: 0.5,
    borderColor: theme.borderSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.textPrimary,
    marginBottom: 12,
  },
  actions: { gap: 10 },
  primaryBtn: {
    backgroundColor: theme.textPrimary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: { color: theme.bgPrimary, fontWeight: '600', fontSize: 15 },
  dangerBtn: { paddingVertical: 10, alignItems: 'center' },
  dangerBtnText: { color: theme.heartActive, fontWeight: '600', fontSize: 14 },
});
