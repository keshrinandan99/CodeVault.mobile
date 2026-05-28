import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme, LANGUAGES } from '@/constants/theme';

export type SnippetFormValues = {
  title: string;
  language: string;
  code: string;
  tags: string;
};

type SnippetFormProps = {
  initial: SnippetFormValues;
  submitLabel: string;
  onSubmit: (values: SnippetFormValues) => Promise<void>;
  onCancel: () => void;
};

export function SnippetForm({ initial, submitLabel, onSubmit, onCancel }: SnippetFormProps) {
  const [title, setTitle] = useState(initial.title);
  const [language, setLanguage] = useState(initial.language);
  const [code, setCode] = useState(initial.code);
  const [tags, setTags] = useState(initial.tags);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!code.trim()) {
      setError('Code cannot be empty');
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      await onSubmit({ title: title.trim(), language, code, tags });
    } catch {
      setError('Could not save snippet. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#B91C1C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. useDebounce hook"
          placeholderTextColor={theme.textTertiary}
        />

        <Text style={styles.label}>Language</Text>
        <View style={styles.chipRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.chip, language === lang && styles.chipActive]}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.chipText, language === lang && styles.chipTextActive]}>{lang}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Code</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          value={code}
          onChangeText={setCode}
          placeholder="Paste your snippet here…"
          placeholderTextColor={theme.textTertiary}
          multiline
          textAlignVertical="top"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Tags</Text>
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="hooks, react, utils"
          placeholderTextColor={theme.textTertiary}
          autoCapitalize="none"
        />
        <Text style={styles.hint}>Separate tags with commas</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isSaving}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={theme.bgPrimary} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color={theme.bgPrimary} />
              <Text style={styles.saveBtnText}>{submitLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.bgSecondary,
    borderWidth: 0.5,
    borderColor: theme.borderTertiary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.textPrimary,
  },
  codeInput: {
    minHeight: 200,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 14,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: theme.borderSecondary,
    backgroundColor: theme.bgPrimary,
  },
  chipActive: {
    backgroundColor: theme.textPrimary,
    borderColor: theme.textPrimary,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
  chipTextActive: { color: theme.bgPrimary },
  hint: { fontSize: 12, color: theme.textTertiary, marginTop: 6 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  errorText: { fontSize: 13, color: '#B91C1C', flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: theme.borderSecondary,
    backgroundColor: theme.bgPrimary,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderSecondary,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: theme.textPrimary },
  saveBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.textPrimary,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: theme.bgPrimary },
});
