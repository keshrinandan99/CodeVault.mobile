import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSQLiteContext } from 'expo-sqlite';
import type { Snippet } from '@/types/snippet';
import { theme } from '@/constants/theme';
import { exportSnippet, type ExportFormat } from '@/utils/exports';
import { shareSnippetAsText, shareFileUri } from '@/utils/share';

type ExportShareSectionProps = {
  snippet: Snippet;
  onToast: (message: string, actionLabel?: string, onAction?: () => void) => void;
};

export function ExportShareSection({ snippet, onToast }: ExportShareSectionProps) {
  const db = useSQLiteContext();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (exporting) return;
    setExporting(true);
    try {
      const { uri } = await exportSnippet(db, snippet, format);
      onToast('Saved to exports', 'Open in Files', () => shareFileUri(uri));
    } catch {
      onToast('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.divider} />
      <View style={styles.sectionHdr}>
        <Text style={styles.secLbl}>EXPORT AS</Text>
      </View>
      <View style={styles.exportRow}>
        <TouchableOpacity style={styles.expBtn} onPress={() => handleExport('ts')} disabled={exporting}>
          <Ionicons name="code-slash" size={12} color={theme.textSecondary} />
          <Text style={styles.expBtnText}>.ts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.expBtn} onPress={() => handleExport('txt')} disabled={exporting}>
          <Ionicons name="document-text-outline" size={12} color={theme.textSecondary} />
          <Text style={styles.expBtnText}>.txt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.expBtn} onPress={() => handleExport('json')} disabled={exporting}>
          <Ionicons name="code-working-outline" size={12} color={theme.textSecondary} />
          <Text style={styles.expBtnText}>.json</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.shareBtn}
        onPress={() => shareSnippetAsText(snippet)}
        disabled={exporting}
      >
        <Ionicons name="share-outline" size={16} color={theme.bgPrimary} />
        <Text style={styles.shareBtnText}>Share snippet</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 24 },
  divider: {
    borderTopWidth: 0.5,
    borderTopColor: theme.borderTertiary,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  sectionHdr: { paddingHorizontal: 16, paddingVertical: 6 },
  secLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  expBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: theme.borderSecondary,
    backgroundColor: theme.bgSecondary,
  },
  expBtnText: { fontSize: 11, fontWeight: '600', color: theme.textSecondary },
  shareBtn: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: theme.textPrimary,
  },
  shareBtnText: { fontSize: 14, fontWeight: '600', color: theme.bgPrimary },
});
