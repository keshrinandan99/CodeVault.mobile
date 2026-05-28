import React from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { NativeCodeBlock } from './NativeCodeBlock';
import { getCodeTheme } from './codeTheme';

type FullscreenCodeModalProps = {
  visible: boolean;
  code: string;
  language: string;
  onClose: () => void;
};

export function FullscreenCodeModal({
  visible,
  code,
  language,
  onClose,
}: FullscreenCodeModalProps) {
  const scheme = useColorScheme();
  const hlTheme = getCodeTheme(scheme === 'dark');
  const fontFamily = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{language}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <ScrollView style={styles.vertical} showsVerticalScrollIndicator>
            <NativeCodeBlock
              code={code}
              language={language}
              hlTheme={hlTheme}
              fontSize={13}
              fontFamily={fontFamily}
            />
          </ScrollView>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bgPrimary, paddingTop: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: theme.textPrimary },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertical: { flex: 1, padding: 12 },
});
