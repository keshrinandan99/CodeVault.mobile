import { StyleSheet, Text, View, TouchableOpacity, TextInput, FlatList } from 'react-native'
import React, { useState,useCallback,useEffect } from 'react'
import useDebounce from '@/hooks/useDebounce';
import { Snippet } from '@/types/snippet';
import { useSQLiteContext } from "expo-sqlite";
import { Ionicons } from '@expo/vector-icons';
import {SnippetCard} from '@/components/SnippetCard'
import { SafeAreaView } from 'react-native-safe-area-context';
const theme = {
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F8F9FA',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    textTertiary: '#9CA3AF',
    textInfo: '#3B82F6',
    borderSecondary: '#E5E7EB',
    borderTertiary: '#F3F4F6',
    heartActive: '#E24B4A',
  };
 

const home = () => {
    const db = useSQLiteContext();
    const [searchQuery,setSearchQuery]=useState('');
    const debouncedQuery=useDebounce(searchQuery,300);
    const [activeLang,setActiveLang]=useState('All');
    const [sortOrder,setSortOrder]=useState('newest');
    const [snippets,setSnippets]=useState<Snippet[]>([]);
    const [stats,setStats]=useState({total:0,favourites:0,languages:0});
    const [languages,setLanguages]=useState<string[]>(['All']);
    const [isLoading,setIsLoading]=useState(true);
    const isSearchActive=debouncedQuery.length>0;
    const fetchDatabaseInfo = useCallback(async () => {
        // 1) Stats
        const statsRow = await db.getFirstAsync<{
          total: number;
          favourites: number | null;
          languages: number;
        }>(`
          SELECT
            COUNT(*) as total,
            SUM(is_favourite) as favourites,
            COUNT(DISTINCT language) as languages
          FROM snippets;
        `);
      
        setStats({
          total: statsRow?.total ?? 0,
          favourites: statsRow?.favourites ?? 0,
          languages: statsRow?.languages ?? 0,
        });
      
        // 2) Languages
        const langRows = await db.getAllAsync<{ language: string }>(`
          SELECT DISTINCT language FROM snippets ORDER BY language;
        `);
      
        setLanguages(["All", ...langRows.map(r => r.language).filter(Boolean)]);
      }, [db]);
      const fetchSnippetsData = useCallback(async () => {
        setIsLoading(true);
        try {
          const query = debouncedQuery.trim();
          const like = `%${query}%`;          // if query is "", this becomes "%%" => matches all
          const lang = activeLang;           // 'All' or a real language
      
          // Safe ORDER BY selection (controlled by your app state)
          const orderBy =
            sortOrder === "oldest"
              ? "create_at ASC"
              : sortOrder === "favourites"
                ? "is_favourite DESC, create_at DESC"
                : "create_at DESC"; // default "newest"
      
          // If your column is `tags` (comma-separated), this matches the mock SQL comment.
          const rows = await db.getAllAsync<{
            id: string;
            title: string;
            language: string;
            code: string;
            tags: string;
            create_at: number;
            is_favourite: number;
          }>(`
            SELECT id, title, language, code, tags, create_at, is_favourite
            FROM snippets
            WHERE
              (title LIKE ? OR code LIKE ? OR tags LIKE ?)
              AND (language = ? OR ? = 'All')
            ORDER BY ${orderBy};
          `, [like, like, like, lang, lang]);
      
          const mappedSnippets: Snippet[] = rows.map(r => ({
            id: r.id,
            title: r.title,
            language: r.language,
            code: r.code,
            tag: (r.tags ?? "")
              .split(",")
              .map(s => s.trim())
              .filter(Boolean),
            create_at: new Date(r.create_at),
            is_favourite: r.is_favourite === 1,
          }));
      
          setSnippets(mappedSnippets);
        } finally {
          setIsLoading(false);
        }
      }, [db, debouncedQuery, activeLang, sortOrder]);
      useEffect(() => {
        fetchDatabaseInfo();
      }, [fetchDatabaseInfo]);
      
      useEffect(() => {
        fetchSnippetsData();
      }, [fetchSnippetsData]);
      const handleToggleFavourites=(id:string)=>{
      setSnippets(prev =>
  prev.map(s => (s.id === id ? { ...s, is_favourite: !s.is_favourite } : s))
);
      }

      const renderSnippetItem = useCallback(
        ({ item }: { item: Snippet }) => (
          <SnippetCard item={item} onToggleFavourite={handleToggleFavourites} />
        ),
        [handleToggleFavourites]
      );
      const cycleSort = () => {
        const orders = ['newest', 'oldest', 'A-Z'];
        const next = orders[(orders.indexOf(sortOrder) + 1) % orders.length];
        setSortOrder(next);
        
      };
// header 
const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>CodeVault</Text>
        <Text style={styles.headerSub}>{stats.total} snippets saved</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.headerBtn} onPress={cycleSort}>
          <Ionicons name="filter" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      
      </View>
    </View>
  );
  //searchBar
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={theme.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search snippets, tags, language…"
          placeholderTextColor={theme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  // empty state
  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyState}>
        <Ionicons name="folder-open-outline" size={64} color={theme.borderSecondary} />
        <Text style={styles.emptyTitle}>No snippets found</Text>
        <Text style={styles.emptySub}>
          {isSearchActive ? "Try adjusting your search or filters." : "Save your first reusable code."}
        </Text>
        {!isSearchActive && (
          <TouchableOpacity style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Create Snippet</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  const renderStatsAndFilters = () => {
    if (isSearchActive) return null; // Hide when searching

    return (
      <View>
        {/* Stats Strip */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLbl}>total</Text>
          </View>
          <TouchableOpacity style={styles.statChip} >
            <Text style={styles.statNum}>{stats.favourites}</Text>
            <Text style={styles.statLbl}>favorites</Text>
          </TouchableOpacity>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{stats.languages}</Text>
            <Text style={styles.statLbl}>languages</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>FILTER BY LANGUAGE</Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={languages}
          keyExtractor={item => item}
          contentContainerStyle={styles.chipScroll}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.chip, activeLang === item && styles.chipActive]}
              onPress={() => setActiveLang(item)}
            >
              <Text style={[styles.chipText, activeLang === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT SNIPPETS</Text>
          <TouchableOpacity><Text style={styles.seeAll}>see all</Text></TouchableOpacity>
        </View>
      </View>
    );
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* List content containing everything to maintain proper scroll context */}
      <FlatList
        data={snippets}
        keyExtractor={item => item.id}
        renderItem={renderSnippetItem}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderSearchBar()}
            {renderStatsAndFilters()}
          </>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        // onPress={() => navigation.navigate('CreateSnippet')}
      >
        <Ionicons name="add" size={20} color={theme.bgPrimary} />
        <Text style={styles.fabText}>New snippet</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
  
}
//stats 

export default home

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgPrimary },
    listContent: { paddingBottom: 100 }, // Ensures FAB doesn't cover last item
    
    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
    headerTitle: { fontSize: 24, fontWeight: '600', color: theme.textPrimary },
    headerSub: { fontSize: 13, color: theme.textSecondary, marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: 10 },
    headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.bgSecondary, borderWidth: 0.5, borderColor: theme.borderTertiary, alignItems: 'center', justifyContent: 'center' },
    
    // Search
    searchContainer: { paddingHorizontal: 16, marginBottom: 12 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgSecondary, borderWidth: 0.5, borderColor: theme.borderTertiary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    searchInput: { flex: 1, fontSize: 15, color: theme.textPrimary, padding: 0 },
    
    // Stats
    statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
    statChip: { flex: 1, backgroundColor: theme.bgSecondary, borderRadius: 10, padding: 12, alignItems: 'center' },
    statNum: { fontSize: 20, fontWeight: '600', color: theme.textPrimary },
    statLbl: { fontSize: 12, color: theme.textSecondary, marginTop: 2 },
    
    // Section Headers
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
    sectionLabel: { fontSize: 11, fontWeight: '600', color: theme.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase' },
    seeAll: { fontSize: 13, color: theme.textInfo, fontWeight: '500' },
    
    // Filter Chips
    chipScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
    chip: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 0.5, borderColor: theme.borderSecondary, backgroundColor: 'transparent' },
    chipActive: { backgroundColor: theme.textPrimary, borderColor: theme.textPrimary },
    chipText: { fontSize: 13, fontWeight: '500', color: theme.textSecondary },
    chipTextActive: { color: theme.bgPrimary },
    
    // Snippet Card
   
    
    // FAB
    fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: theme.textPrimary, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
    fabText: { color: theme.bgPrimary, fontSize: 15, fontWeight: '600' },
  
    // Empty State
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.textPrimary, marginTop: 16 },
    emptySub: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 },
    emptyBtn: { backgroundColor: theme.textPrimary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
    emptyBtnText: { color: theme.bgPrimary, fontSize: 15, fontWeight: '600' }
  });