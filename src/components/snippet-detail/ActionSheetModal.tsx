import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { theme } from '@/constants/theme';

export type ActionSheetOption = {
  label: string;
  destructive?: boolean;
  onPress: () => void;
};

type ActionSheetModalProps = {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
};

export function ActionSheetModal({ visible, title, options, onClose }: ActionSheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={styles.option}
              onPress={() => {
                onClose();
                opt.onPress();
              }}
            >
              <Text style={[styles.optionText, opt.destructive && styles.destructive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.option, styles.cancel]} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.bgPrimary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 13,
    color: theme.textTertiary,
    textAlign: 'center',
    paddingVertical: 12,
    fontWeight: '500',
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 0.5,
    borderTopColor: theme.borderTertiary,
  },
  optionText: {
    fontSize: 16,
    color: theme.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
  },
  destructive: { color: theme.heartActive },
  cancel: { marginTop: 8 },
  cancelText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
