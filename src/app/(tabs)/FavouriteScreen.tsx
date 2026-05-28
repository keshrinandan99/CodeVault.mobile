import {
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
  LayoutAnimation,
  TouchableOpacity,
  Platform,
} from 'react-native'
import React, { useCallback, useMemo, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { SnippetCard } from '@/components/SnippetCard'
import { useSQLiteContext } from 'expo-sqlite'
import type { Snippet } from '@/types/snippet'
import { SafeAreaView } from 'react-native-safe-area-context'
import { mapRowToSnippet, SNIPPET_SELECT, type DbSnippetRow } from '@/utils/snippetDb'
import { toggleFavoriteInDb } from '@/utils/favourites'

function FavouritesEmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#D1D5DB" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No favourites yet</Text>
      <Text style={styles.emptySub}>Tap ♥ on any snippet to save it here</Text>
      <TouchableOpacity style={styles.ghostButton} onPress={() => router.push('/(tabs)/home')}>
        <Text style={styles.ghostButtonText}>Browse snippets</Text>
      </TouchableOpacity>
    </View>
  )
}

const FavouriteScreen = () => {
  const db = useSQLiteContext()
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')

  const loadFavourites = useCallback(async () => {
    const rows = await db.getAllAsync<DbSnippetRow>(
      `SELECT ${SNIPPET_SELECT} FROM snippets WHERE is_favourite = 1 ORDER BY create_at DESC`
    )
    setSnippets(rows.map(mapRowToSnippet))
  }, [db])

  useFocusEffect(
    useCallback(() => {
      void loadFavourites()
    }, [loadFavourites])
  )

  const languages = useMemo(() => {
    const langs = new Set(snippets.map((s) => s.language))
    return ['All', ...Array.from(langs)].sort()
  }, [snippets])

  // FIX 1: Added missing `return` statement
  // FIX 2: Sort a shallow copy to avoid mutating the filtered array in-place
  const filteredSnippets = useMemo(() => {
    let result = snippets
    if (selectedLanguage !== 'All') {
      result = result.filter((s) => s.language === selectedLanguage)
    }
    return [...result].sort((a, b) => {
      if (sortOrder === 'az') return a.title.localeCompare(b.title)
      if (sortOrder === 'oldest') return a.id.localeCompare(b.id)
      return b.id.localeCompare(a.id)
    })
  }, [snippets, selectedLanguage, sortOrder])

  // FIX 3: Changed `is_favourite` → `is_pinned` to match the Snippet type
  const pinnedSnippets = filteredSnippets.filter((s) => s.is_pinned === 1)
  const regularSnippets = filteredSnippets.filter((s) => s.is_pinned === 0)

  const toggleSort = () => {
    const orders = ['newest', 'oldest', 'az']
    const nextIndex = (orders.indexOf(sortOrder) + 1) % orders.length
    setSortOrder(orders[nextIndex])
  }

  const removeFavorite = (id: string) => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    })
    setSnippets((prev) => prev.filter((s) => s.id !== id))
    toggleFavoriteInDb(db, id, true).catch(() => loadFavourites())
  }

  const handleLongPress = (snippet: Snippet) => {
    Alert.alert(snippet.title, 'Snippet Actions', [
      {
        text: snippet.is_pinned ? 'Unpin' : 'Pin to top',
        onPress: () => {
          if (!snippet.is_pinned && pinnedSnippets.length >= 3) {
            Alert.alert('Limit Reached', 'You can only pin up to 3 snippets.')
            return
          }
          setSnippets((prev) =>
            prev.map((s) =>
              s.id === snippet.id ? { ...s, is_pinned: s.is_pinned ? 0 : 1 } : s
            )
          )
        },
      },
      { text: 'Share', onPress: () => console.log('Sharing.shareAsync') },
      {
        text: 'Remove from favourites',
        style: 'destructive',
        onPress: () => removeFavorite(snippet.id),
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Favourites</Text>
          <Text style={styles.headerSub}>{snippets.length} snippets saved</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={16} color="#4B5563" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={toggleSort}>
            <Ionicons name="options-outline" size={16} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>

      {snippets.length === 0 ? (
        <FavouritesEmptyState />
      ) : (
        <>
          {/* CHIPS */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.chip, selectedLanguage === lang && styles.chipActive]}
                  onPress={() => setSelectedLanguage(lang)}
                >
                  <Text
                    style={[styles.chipText, selectedLanguage === lang && styles.chipTextActive]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* LISTS */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* PINNED SECTION */}
            {pinnedSnippets.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>PINNED</Text>
                  <Text style={styles.sectionAction}>edit</Text>
                </View>
                {pinnedSnippets.map((snippet) => (
                  <SnippetCard
                    key={snippet.id}
                    item={snippet}
                    onPress={(snippetId) => router.push(`/snippets/${snippetId}`)}
                    onLongPress={() => handleLongPress(snippet)}
                  />
                ))}
              </View>
            )}

            {/* ALL FAVOURITES SECTION */}
            {regularSnippets.length > 0 && (
              <View style={[styles.section, { marginTop: pinnedSnippets.length > 0 ? 12 : 0 }]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>ALL FAVOURITES</Text>
                  <Text style={styles.sectionAction}>see all</Text>
                </View>
                {regularSnippets.map((snippet) => (
                  <SnippetCard
                    key={snippet.id}
                    item={snippet}
                    onPress={(snippetId) => router.push(`/snippets/${snippetId}`)}
                    onLongPress={() => handleLongPress(snippet)}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  )
}
export default FavouriteScreen

const styles = StyleSheet.create({


  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  headerSub: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7F7F9',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  chipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  sectionAction: {
    fontSize: 12,
    color: '#0ea5e9', // Info blue color
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    paddingRight: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  codeBlock: {
    backgroundColor: '#F7F7F9',
    borderRadius: 6,
    padding: 8,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: '#4B5563',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F7F7F9',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  tagText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: -40, // Visual adjustment to center nicely
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  ghostButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  ghostButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
})