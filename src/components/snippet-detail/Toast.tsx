import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '@/constants/theme';

type ToastProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  visible: boolean;
  onHide: () => void;
  duration?: number;
};

export function Toast({
  message,
  actionLabel,
  onAction,
  visible,
  onHide,
  duration = 3500,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onHide, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onHide]);

  if (!visible) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.toast}>
        <Text style={styles.message}>{message}</Text>
        {actionLabel && onAction ? (
          <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.action}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    maxWidth: '100%',
  },
  message: { color: theme.bgPrimary, fontSize: 13, flexShrink: 1 },
  action: { color: theme.textInfo, fontSize: 13, fontWeight: '600' },
});
