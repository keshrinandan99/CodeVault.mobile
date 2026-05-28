import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '@/constants/theme';

type SnippetDetailHeaderProps = {
  isFavourite: boolean;
  onToggleFavourite: () => void;
  onEdit: () => void;
  onMenu: () => void;
};

export function SnippetDetailHeader({
  isFavourite,
  onToggleFavourite,
  onEdit,
  onMenu,
}: SnippetDetailHeaderProps) {
  return (
    <View style={styles.topbar}>
      <View style={styles.left}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Snippet details</Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity style={styles.iconBtn} onPress={onToggleFavourite}>
          <Ionicons
            name={isFavourite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavourite ? theme.heartActive : theme.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onEdit}>
          <Ionicons name="pencil" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onMenu}>
          <Ionicons name="ellipsis-vertical" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  right: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.bgSecondary,
    borderWidth: 0.5,
    borderColor: theme.borderTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '500', color: theme.textPrimary },
});
