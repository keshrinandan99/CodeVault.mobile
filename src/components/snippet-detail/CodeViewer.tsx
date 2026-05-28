import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme } from '@/constants/theme';
import { FullscreenCodeModal } from './FullscreenCodeModal';
import { NativeCodeBlock } from './NativeCodeBlock';
import { getCodeTheme } from './codeTheme';

type CodeViewerProps = {
  code: string;
  language: string;
  onCopied?: () => void;
};

export function CodeViewer({ code, language, onCopied }: CodeViewerProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const scheme = useColorScheme();
  const hlTheme = getCodeTheme(scheme === 'dark');
  const fontFamily = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    onCopied?.();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHdr}>
        <Text style={styles.secLbl}>CODE</Text>
        <View style={styles.secActs}>
          <TouchableOpacity style={styles.secAct} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={12} color={theme.textInfo} />
            <Text style={styles.secActText}>copy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secAct} onPress={() => setFullscreen(true)}>
            <Ionicons name="expand-outline" size={12} color={theme.textInfo} />
            <Text style={styles.secActText}>expand</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.toolbar}>
          <Text style={styles.lang}>{language}</Text>
          <View style={styles.toolbarActs}>
            <TouchableOpacity style={styles.toolBtn} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={11} color={theme.textSecondary} />
              <Text style={styles.toolBtnText}>copy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setFullscreen(true)}>
              <Ionicons name="expand-outline" size={11} color={theme.textSecondary} />
              <Text style={styles.toolBtnText}>fullscreen</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator nestedScrollEnabled>
          <View style={styles.codePad}>
            <NativeCodeBlock
              code={code}
              language={language}
              hlTheme={hlTheme}
              fontSize={12}
              fontFamily={fontFamily}
            />
          </View>
        </ScrollView>
      </View>

      <FullscreenCodeModal
        visible={fullscreen}
        code={code}
        language={language}
        onClose={() => setFullscreen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  sectionHdr: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  secLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  secActs: { flexDirection: 'row', gap: 12 },
  secAct: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  secActText: { fontSize: 12, color: theme.textInfo, fontWeight: '500' },
  block: {
    marginHorizontal: 16,
    backgroundColor: theme.bgSecondary,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: theme.borderTertiary,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.borderTertiary,
  },
  lang: { fontSize: 11, fontWeight: '600', color: theme.textSecondary },
  toolbarActs: { flexDirection: 'row', gap: 6 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: theme.borderSecondary,
    backgroundColor: theme.bgPrimary,
  },
  toolBtnText: { fontSize: 10, color: theme.textSecondary },
  codePad: { padding: 10, minWidth: 280 },
});
