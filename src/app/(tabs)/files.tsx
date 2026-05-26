/**
 * CodeVault — FileManagerScreen.tsx
 *
 * React Native screen implementing the File Manager mockup.
 * Dependencies (add to package.json if not present):
 *   expo-file-system, expo-document-picker, expo-sharing,
 *   expo-sqlite, @react-navigation/native, react-native-safe-area-context
 *   @expo/vector-icons (MaterialCommunityIcons used here)
 *
 * SQLite schema assumed:
 *   CREATE TABLE files (
 *     id         INTEGER PRIMARY KEY AUTOINCREMENT,
 *     name       TEXT NOT NULL,
 *     uri        TEXT NOT NULL,
 *     mime_type  TEXT,
 *     size_bytes INTEGER DEFAULT 0,
 *     snippet_id INTEGER,
 *     folder     TEXT,          -- 'snippets' | 'attachments' | 'exports' | 'templates'
 *     created_at TEXT DEFAULT (datetime('now'))
 *   );
 */

import React, {
    useState,
    useCallback,
    useRef,
    useEffect,
  } from 'react';
  import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TouchableHighlight,
    FlatList,
    StyleSheet,
    Dimensions,
    Alert,
    TextInput,
    Modal,
    Animated,
    ActivityIndicator,
    Platform,
    StatusBar,
  } from 'react-native';
//   import { useFocusEffect } from '@react-navigation/native';
  import { SafeAreaView } from 'react-native-safe-area-context';
  import * as FileSystem from 'expo-file-system/legacy';
  import * as DocumentPicker from 'expo-document-picker';
  import * as Sharing from 'expo-sharing';
  import * as SQLite from 'expo-sqlite';
  import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
  
  // ─── Theme ──────────────────────────────────────────────────────────────────
  
  const COLORS = {
    bg:            '#0F0F10',
    bgCard:        '#18181B',
    bgElevated:    '#1F1F24',
    border:        '#2C2C31',
    borderSubtle:  '#222226',
    textPrimary:   '#F2F2F3',
    textSecondary: '#8A8A94',
    textTertiary:  '#4E4E58',
    accent:        '#7C6BFA',      // violet
    accentFaint:   '#7C6BFA22',
    info:          '#5BBFFF',
    danger:        '#FF5A5A',
    // file-type chips
    ts:   { bg: '#0D2640', fg: '#5BBFFF' },
    js:   { bg: '#2A1A00', fg: '#FFB433' },
    json: { bg: '#0A2519', fg: '#3DD68C' },
    img:  { bg: '#1A0F2E', fg: '#A78BFA' },
    txt:  { bg: '#1A1A1A', fg: '#9E9EA8' },
    py:   { bg: '#002030', fg: '#4EC9B0' },
  };
  
  const FONT = Platform.select({ ios: 'SF Pro Display', android: 'Roboto' }) ?? 'System';
  
  // ─── Types ───────────────────────────────────────────────────────────────────
  
  type FileType = 'all' | 'snippets' | 'images' | 'exports';
  
  interface FileRow {
    id: number;
    name: string;
    uri: string;
    mime_type: string | null;
    size_bytes: number;
    snippet_id: number | null;
    folder: string | null;
    created_at: string;
  }
  
  interface FolderDef {
    key: string;
    label: string;
    icon: string;
    path: string;
  }
  
  // ─── Constants ───────────────────────────────────────────────────────────────
  
  const FOLDERS: FolderDef[] = [
    { key: 'snippets',    label: 'Snippets',     icon: 'code-braces',     path: 'codevault/snippets/'    },
    { key: 'attachments', label: 'Attachments',  icon: 'image-multiple',  path: 'codevault/attachments/' },
    { key: 'exports',     label: 'Exports',      icon: 'export-variant',  path: 'codevault/exports/'     },
    { key: 'templates',   label: 'Templates',    icon: 'view-grid-plus',  path: 'codevault/templates/'   },
  ];
  
  const SEGMENT_TABS: { key: FileType; label: string }[] = [
    { key: 'all',      label: 'All files' },
    { key: 'snippets', label: 'Snippets'  },
    { key: 'images',   label: 'Images'    },
    { key: 'exports',  label: 'Exports'   },
  ];
  
  const EMPTY_MESSAGES: Record<string, { title: string; body: string; icon: string }> = {
    templates:  { icon: 'view-grid-plus', title: 'No templates yet',           body: 'Download a template to get started.'               },
    images:     { icon: 'image-off',      title: 'No images',                  body: 'Screenshots attached to snippets will appear here.' },
    exports:    { icon: 'export-off',     title: 'Nothing exported yet',       body: 'Export a snippet to see files here.'                },
    snippets:   { icon: 'code-off',       title: 'No code snippets',           body: 'Save a snippet to see its files here.'              },
    all:        { icon: 'folder-open',    title: 'No files yet',               body: 'Import a file or export a snippet to get started.'  },
  };
  
  // ─── Helpers ─────────────────────────────────────────────────────────────────
  
  function formatSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1_048_576)   return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  
  function relativeDate(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diff / 60_000);
    const hours = Math.floor(diff / 3_600_000);
    const days  = Math.floor(diff / 86_400_000);
    if (mins  < 60)  return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days  === 1) return 'Yesterday';
    return `${days}d ago`;
  }
  
  function fileChipStyle(name: string, mime: string | null) {
    if (mime?.startsWith('image/'))         return COLORS.img;
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'ts' || ext === 'tsx')      return COLORS.ts;
    if (ext === 'js' || ext === 'jsx')      return COLORS.js;
    if (ext === 'json')                     return COLORS.json;
    if (ext === 'py')                       return COLORS.py;
    return COLORS.txt;
  }
  
  function fileIcon(name: string, mime: string | null): string {
    if (mime?.startsWith('image/'))         return 'image';
    const ext = name.split('.').pop()?.toLowerCase();
    if (['ts','tsx','js','jsx','py'].includes(ext ?? '')) return 'code-braces-box';
    if (ext === 'json')                     return 'code-json';
    return 'file-document';
  }
  
  // ─── Database layer (expo-sqlite v56 async API) ───────────────────────────────
  
  let dbInstance: SQLite.SQLiteDatabase | null = null;
  
  async function getDb(): Promise<SQLite.SQLiteDatabase> {
    if (!dbInstance) {
      dbInstance = await SQLite.openDatabaseAsync('codevault.db');
    }
    return dbInstance;
  }
  
  async function ensureSchema() {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS files (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        uri        TEXT    NOT NULL,
        mime_type  TEXT,
        size_bytes INTEGER DEFAULT 0,
        snippet_id INTEGER,
        folder     TEXT,
        created_at TEXT    DEFAULT (datetime('now'))
      )
    `);
  }
  
  async function queryFiles(filter: FileType, folderKey?: string): Promise<FileRow[]> {
    const db = await getDb();
    let sql = 'SELECT * FROM files WHERE 1=1';
    const args: (string | number)[] = [];
  
    if (folderKey) {
      sql += ' AND folder = ?';
      args.push(folderKey);
    } else {
      if (filter === 'snippets') { sql += ' AND snippet_id IS NOT NULL'; }
      if (filter === 'images') { sql += ' AND mime_type LIKE ?'; args.push('image/%'); }
      if (filter === 'exports') { sql += " AND folder = 'exports'"; }
    }
  
    sql += ' ORDER BY created_at DESC';
    return db.getAllAsync<FileRow>(sql, args);
  }
  
  async function queryStats() {
    const db = await getDb();
    const total =
      (await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM files'))?.c ?? 0;
    const images =
      (await db.getFirstAsync<{ c: number }>(
        "SELECT COUNT(*) as c FROM files WHERE mime_type LIKE 'image/%'"
      ))?.c ?? 0;
    const bytes =
      (await db.getFirstAsync<{ s: number }>(
        'SELECT COALESCE(SUM(size_bytes),0) as s FROM files'
      ))?.s ?? 0;
    const folderCounts: Record<string, number> = {};
    for (const f of FOLDERS) {
      folderCounts[f.key] =
        (await db.getFirstAsync<{ c: number }>(
          'SELECT COUNT(*) as c FROM files WHERE folder = ?',
          [f.key]
        ))?.c ?? 0;
    }
    return { total, images, bytes, folderCounts };
  }
  
  async function runWrite(sql: string, args: (string | number | null)[] = []) {
    const db = await getDb();
    await db.runAsync(sql, args);
  }
  
  async function deleteFile(file: FileRow) {
    try { await FileSystem.deleteAsync(file.uri, { idempotent: true }); } catch {}
    await runWrite('DELETE FROM files WHERE id = ?', [file.id]);
  }
  
  // ─── Sub-components ──────────────────────────────────────────────────────────
  
  // Stat chip
  const StatChip = ({ num, label }: { num: string; label: string }) => (
    <View style={styles.statChip}>
      <Text style={styles.statNum}>{num}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
  
  // Folder card
  const FolderCard = ({
    folder, count, onPress,
  }: { folder: FolderDef; count: number; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.folderCard} activeOpacity={0.7}>
      <Icon name={folder.icon as any} size={24} color={COLORS.accent} style={{ marginBottom: 6 }} />
      <Text style={styles.folderName} numberOfLines={1}>{folder.label}</Text>
      <Text style={styles.folderCount}>{count} {count === 1 ? 'file' : 'files'}</Text>
    </TouchableOpacity>
  );
  
  // File row
  const FileRowItem = ({
    file,
    selected,
    multiSelect,
    onPress,
    onLongPress,
    onMenuPress,
  }: {
    file: FileRow;
    selected: boolean;
    multiSelect: boolean;
    onPress: () => void;
    onLongPress: () => void;
    onMenuPress: () => void;
  }) => {
    const chip = fileChipStyle(file.name, file.mime_type);
    const icon = fileIcon(file.name, file.mime_type);
  
    return (
      <TouchableHighlight
        onPress={onPress}
        onLongPress={onLongPress}
        underlayColor={COLORS.bgElevated}
        style={[styles.fileRow, selected && styles.fileRowSelected]}
      >
        <>
          {multiSelect && (
            <View style={[styles.checkbox, selected && styles.checkboxActive]}>
              {selected && <Icon name="check" size={12} color="#fff" />}
            </View>
          )}
          <View style={[styles.fileIcon, { backgroundColor: chip.bg }]}>
            <Icon name={icon as any} size={18} color={chip.fg} />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <Text style={styles.fileMeta}>
              {formatSize(file.size_bytes)} · {relativeDate(file.created_at)}
            </Text>
          </View>
          {!multiSelect && (
            <TouchableOpacity onPress={onMenuPress} style={styles.fileMenuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="dots-vertical" size={18} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </>
      </TouchableHighlight>
    );
  };
  
  // Empty state
  const EmptyState = ({ type }: { type: string }) => {
    const msg = EMPTY_MESSAGES[type] ?? EMPTY_MESSAGES.all;
    return (
      <View style={styles.emptyState}>
        <Icon name={msg.icon as any} size={36} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>{msg.title}</Text>
        <Text style={styles.emptyBody}>{msg.body}</Text>
      </View>
    );
  };
  
  // ─── Action sheet modal ──────────────────────────────────────────────────────
  
  interface ActionSheetProps {
    file: FileRow | null;
    visible: boolean;
    onClose: () => void;
    onRefresh: () => void;
  }
  
  const ActionSheet = ({ file, visible, onClose, onRefresh }: ActionSheetProps) => {
    const slideAnim = useRef(new Animated.Value(300)).current;
    const [renaming, setRenaming] = useState(false);
    const [newName, setNewName]   = useState('');
  
    useEffect(() => {
      if (visible) {
        setRenaming(false);
        setNewName(file?.name ?? '');
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20 }).start();
      } else {
        Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }).start();
      }
    }, [visible]);
  
    if (!file) return null;
  
    const handleShare = async () => {
      onClose();
      try { await Sharing.shareAsync(file.uri); } catch (e) { Alert.alert('Share failed', String(e)); }
    };
  
    const handleDelete = () => {
      Alert.alert('Delete file', `Delete "${file.name}"? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            onClose();
            await deleteFile(file);
            onRefresh();
          },
        },
      ]);
    };
  
    const handleRename = async () => {
      if (!newName.trim() || newName === file.name) { setRenaming(false); return; }
      const dir   = file.uri.substring(0, file.uri.lastIndexOf('/') + 1);
      const newUri = dir + newName.trim();
      try {
        await FileSystem.moveAsync({ from: file.uri, to: newUri });
        await runWrite('UPDATE files SET name = ?, uri = ? WHERE id = ?', [newName.trim(), newUri, file.id]);
      } catch (e) { Alert.alert('Rename failed', String(e)); }
      setRenaming(false);
      onClose();
      onRefresh();
    };
  
    const ACTIONS = [
      { icon: 'share-variant', label: 'Share',  color: COLORS.info,   onPress: handleShare  },
      { icon: 'pencil',        label: 'Rename', color: COLORS.accent,  onPress: () => setRenaming(true) },
      { icon: 'trash-can',     label: 'Delete', color: COLORS.danger,  onPress: handleDelete },
    ];
  
    return (
      <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* file header */}
          <View style={styles.sheetHeader}>
            <View style={[styles.fileIcon, { backgroundColor: fileChipStyle(file.name, file.mime_type).bg }]}>
              <Icon name={fileIcon(file.name, file.mime_type) as any} size={18} color={fileChipStyle(file.name, file.mime_type).fg} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.sheetFileName} numberOfLines={1}>{file.name}</Text>
              <Text style={styles.sheetFileMeta}>{formatSize(file.size_bytes)}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
  
          <View style={styles.sheetDivider} />
  
          {renaming ? (
            <View style={styles.renameRow}>
              <TextInput
                style={styles.renameInput}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                selectTextOnFocus
                onSubmitEditing={handleRename}
                returnKeyType="done"
                placeholderTextColor={COLORS.textTertiary}
              />
              <TouchableOpacity onPress={handleRename} style={styles.renameConfirm}>
                <Text style={{ color: COLORS.accent, fontWeight: '600', fontSize: 14 }}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            ACTIONS.map(a => (
              <TouchableOpacity key={a.label} style={styles.sheetAction} onPress={a.onPress}>
                <Icon name={a.icon as any} size={20} color={a.color} />
                <Text style={[styles.sheetActionLabel, { color: a.color }]}>{a.label}</Text>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>
      </Modal>
    );
  };
  
  // ─── Search bar ───────────────────────────────────────────────────────────────
  
  const SearchBar = ({ value, onChange, onClose }: {
    value: string; onChange: (v: string) => void; onClose: () => void;
  }) => (
    <View style={styles.searchBar}>
      <Icon name="magnify" size={18} color={COLORS.textSecondary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search files…"
        placeholderTextColor={COLORS.textTertiary}
        value={value}
        onChangeText={onChange}
        autoFocus
      />
      <TouchableOpacity onPress={onClose}>
        <Icon name="close-circle" size={18} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </View>
  );
  
  // ─── Main screen ─────────────────────────────────────────────────────────────
  
  export default function FileManagerScreen({ navigation }: any) {
    const [activeTab,    setActiveTab]    = useState<FileType>('all');
    const [files,        setFiles]        = useState<FileRow[]>([]);
    const [stats,        setStats]        = useState({ total: 0, images: 0, bytes: 0, folderCounts: {} as Record<string, number> });
    const [activeDrill,  setActiveDrill]  = useState<FolderDef | null>(null);
    const [loading,      setLoading]      = useState(true);
    const [importing,    setImporting]    = useState(false);
    const [searchOpen,   setSearchOpen]   = useState(false);
    const [searchQuery,  setSearchQuery]  = useState('');
    const [actionFile,   setActionFile]   = useState<FileRow | null>(null);
    const [sheetVisible, setSheetVisible] = useState(false);
    const [selected,     setSelected]     = useState<Set<number>>(new Set());
    const [multiSelect,  setMultiSelect]  = useState(false);
  
    // ── Init
    useEffect(() => { ensureSchema(); }, []);
  
    // ── Refresh on focus
    // useFocusEffect(useCallback(() => {
    //   refresh();
    // }, [activeTab, activeDrill]));
  
    const refresh = useCallback(async () => {
      setLoading(true);
      const [rows, s] = await Promise.all([
        queryFiles(activeTab, activeDrill?.key),
        queryStats(),
      ]);
      setFiles(rows);
      setStats(s);
      setSelected(new Set());
      setMultiSelect(false);
      setLoading(false);
    }, [activeTab, activeDrill]);
  
    // ── Filter by search
    const visibleFiles = searchQuery.trim()
      ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : files;
  
    // ── Import
    const handleImport = async () => {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false });
      if (result.canceled) return;
      setImporting(true);
      try {
        const asset  = result.assets[0];
        const folder = activeDrill?.key ?? 'snippets';
        const dir    = `${FileSystem.documentDirectory}codevault/${folder}/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const dest = dir + asset.name;
        await FileSystem.copyAsync({ from: asset.uri, to: dest });
        await runWrite(
          'INSERT INTO files (name, uri, mime_type, size_bytes, folder) VALUES (?, ?, ?, ?, ?)',
          [asset.name, dest, asset.mimeType ?? null, asset.size ?? 0, folder]
        );
        await refresh();
      } catch (e) {
        Alert.alert('Import failed', String(e));
      } finally {
        setImporting(false);
      }
    };
  
    // ── Multi-select delete
    const handleBulkDelete = () => {
      Alert.alert('Delete selected', `Delete ${selected.size} file(s)?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            const toDelete = files.filter(f => selected.has(f.id));
            await Promise.all(toDelete.map(deleteFile));
            await refresh();
          },
        },
      ]);
    };
  
    const handleBulkShare = async () => {
      const toShare = files.filter(f => selected.has(f.id));
      for (const f of toShare) {
        try { await Sharing.shareAsync(f.uri); } catch {}
      }
    };
  
    const toggleSelect = (id: number) => {
      setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    };
  
    // ── Render header
    const renderHeader = () => (
      <>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
  
        {/* top bar */}
        {searchOpen ? (
          <SearchBar value={searchQuery} onChange={setSearchQuery} onClose={() => { setSearchOpen(false); setSearchQuery(''); }} />
        ) : (
          <View style={styles.topBar}>
            {activeDrill ? (
              <TouchableOpacity onPress={() => setActiveDrill(null)} style={styles.backBtn}>
                <Icon name="chevron-left" size={22} color={COLORS.textPrimary} />
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.screenTitle}>{activeDrill ? activeDrill.label : 'File manager'}</Text>
              <Text style={styles.screenSub}>{stats.total} files · {formatSize(stats.bytes)} used</Text>
            </View>
            <View style={styles.topActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setSearchOpen(true)}>
                <Icon name="magnify" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}
                onPress={() => Alert.alert('Bulk actions', 'Choose an option', [
                  { text: 'Delete all exports', onPress: async () => {
                    const exports = files.filter(f => f.folder === 'exports');
                    await Promise.all(exports.map(deleteFile));
                    refresh();
                  }},
                  { text: 'Cancel', style: 'cancel' },
                ])}>
                <Icon name="dots-vertical" size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
  
        {/* breadcrumb */}
        {activeDrill && (
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbInactive} onPress={() => setActiveDrill(null)}>Files</Text>
            <Icon name="chevron-right" size={14} color={COLORS.textTertiary} />
            <Text style={styles.breadcrumbActive}>{activeDrill.label}</Text>
          </View>
        )}
  
        {/* stats — only on root */}
        {!activeDrill && (
          <View style={styles.statsRow}>
            <StatChip num={String(stats.total - stats.images)} label="code files" />
            <StatChip num={String(stats.images)} label="images" />
            <StatChip num={formatSize(stats.bytes)} label="used" />
          </View>
        )}
  
        {/* segment tabs — only on root */}
        {!activeDrill && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.segScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {SEGMENT_TABS.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.segBtn, activeTab === tab.key && styles.segBtnActive]}
                onPress={() => { setActiveTab(tab.key); setFiles([]); }}
              >
                <Text style={[styles.segBtnText, activeTab === tab.key && styles.segBtnTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
  
        {/* folders — only on root "all" tab */}
        {!activeDrill && activeTab === 'all' && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>FOLDERS</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }} style={{ marginBottom: 8 }}>
              {FOLDERS.map(f => (
                <FolderCard
                  key={f.key}
                  folder={f}
                  count={stats.folderCounts[f.key] ?? 0}
                  onPress={() => { setActiveDrill(f); setFiles([]); }}
                />
              ))}
            </ScrollView>
          </>
        )}
  
        {/* files section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{activeDrill ? 'FILES' : 'RECENT FILES'}</Text>
          <TouchableOpacity onPress={() => setFiles(prev => [...prev].reverse())}>
            <Text style={styles.sectionAction}>sort</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  
    // ── Render
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.container}>
  
          <FlatList
            data={visibleFiles}
            keyExtractor={item => String(item.id)}
            ListHeaderComponent={renderHeader}
            renderItem={({ item }) => (
              <FileRowItem
                file={item}
                selected={selected.has(item.id)}
                multiSelect={multiSelect}
                onPress={() => {
                  if (multiSelect) { toggleSelect(item.id); }
                  // else open viewer (wire to navigation if needed)
                }}
                onLongPress={() => {
                  setMultiSelect(true);
                  toggleSelect(item.id);
                }}
                onMenuPress={() => { setActionFile(item); setSheetVisible(true); }}
              />
            )}
            ListEmptyComponent={
              loading
                ? <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.accent} />
                : <EmptyState type={activeDrill?.key ?? activeTab} />
            }
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
  
          {/* FAB */}
          {!multiSelect && (
            <TouchableOpacity style={styles.fab} onPress={handleImport} activeOpacity={0.85}>
              {importing
                ? <ActivityIndicator size="small" color={COLORS.bg} />
                : <Icon name="upload" size={16} color={COLORS.bg} />
              }
              <Text style={styles.fabLabel}>{importing ? 'Importing…' : 'Import file'}</Text>
            </TouchableOpacity>
          )}
  
          {/* Multi-select bottom bar */}
          {multiSelect && (
            <View style={styles.multiBar}>
              <Text style={styles.multiCount}>{selected.size} selected</Text>
              <View style={styles.multiActions}>
                <TouchableOpacity style={styles.multiBtn} onPress={handleBulkShare}>
                  <Icon name="share-variant" size={18} color={COLORS.info} />
                  <Text style={[styles.multiBtnLabel, { color: COLORS.info }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.multiBtn} onPress={handleBulkDelete}>
                  <Icon name="trash-can" size={18} color={COLORS.danger} />
                  <Text style={[styles.multiBtnLabel, { color: COLORS.danger }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.multiBtn} onPress={() => { setMultiSelect(false); setSelected(new Set()); }}>
                  <Icon name="close" size={18} color={COLORS.textSecondary} />
                  <Text style={[styles.multiBtnLabel, { color: COLORS.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
  
          {/* Bottom nav */}
          <View style={styles.bottomNav}>
            {[
              { icon: 'home-variant',  label: 'Home',      active: false },
              { icon: 'heart',         label: 'Favorites', active: false },
              { icon: 'folder',        label: 'Files',     active: true  },
              { icon: 'cog',           label: 'Settings',  active: false },
            ].map(item => (
              <TouchableOpacity key={item.label} style={styles.navItem}>
                <Icon name={item.icon as any} size={22} color={item.active ? COLORS.textPrimary : COLORS.textTertiary} />
                <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
  
        {/* Action sheet */}
        <ActionSheet
          file={actionFile}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onRefresh={refresh}
        />
      </SafeAreaView>
    );
  }
  
  // ─── Styles ──────────────────────────────────────────────────────────────────
  
  const styles = StyleSheet.create({
    safe:            { flex: 1, backgroundColor: COLORS.bg },
    container:       { flex: 1, backgroundColor: COLORS.bg },
  
    // top bar
    topBar:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    backBtn:         { marginRight: 8, padding: 2 },
    screenTitle:     { fontSize: 22, fontWeight: '600', color: COLORS.textPrimary, fontFamily: FONT },
    screenSub:       { fontSize: 12, color: COLORS.textSecondary, marginTop: 1, fontFamily: FONT },
    topActions:      { flexDirection: 'row', gap: 8 },
    iconBtn:         { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.bgCard, borderWidth: 0.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  
    // search
    searchBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, marginHorizontal: 16, marginTop: 10, marginBottom: 4, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderWidth: 0.5, borderColor: COLORS.border },
    searchInput:     { flex: 1, color: COLORS.textPrimary, fontSize: 14, fontFamily: FONT, padding: 0 },
  
    // breadcrumb
    breadcrumb:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 4 },
    breadcrumbInactive: { fontSize: 12, color: COLORS.textTertiary },
    breadcrumbActive:   { fontSize: 12, color: COLORS.textPrimary, fontWeight: '600' },
  
    // stats
    statsRow:        { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 10 },
    statChip:        { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 0.5, borderColor: COLORS.borderSubtle },
    statNum:         { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, fontFamily: FONT },
    statLbl:         { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  
    // segment
    segScroll:       { marginBottom: 10 },
    segBtn:          { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 0.5, borderColor: COLORS.border },
    segBtnActive:    { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
    segBtnText:      { fontSize: 13, fontWeight: '500', color: COLORS.textSecondary },
    segBtnTextActive:{ color: '#fff' },
  
    // section header
    sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
    sectionLabel:    { fontSize: 11, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 0.8 },
    sectionAction:   { fontSize: 12, color: COLORS.info },
  
    // folder card
    folderCard:      { width: 90, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: COLORS.borderSubtle },
    folderName:      { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
    folderCount:     { fontSize: 10, color: COLORS.textTertiary, marginTop: 2 },
  
    // file row
    fileRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderSubtle },
    fileRowSelected: { backgroundColor: COLORS.accentFaint },
    fileIcon:        { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    fileInfo:        { flex: 1, marginLeft: 10, minWidth: 0 },
    fileName:        { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
    fileMeta:        { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
    fileMenuBtn:     { padding: 4 },
    checkbox:        { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, marginRight: 10, alignItems: 'center', justifyContent: 'center' },
    checkboxActive:  { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  
    // empty state
    emptyState:      { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
    emptyTitle:      { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary, marginTop: 12, textAlign: 'center' },
    emptyBody:       { fontSize: 13, color: COLORS.textTertiary, marginTop: 6, textAlign: 'center', lineHeight: 18 },
  
    // FAB
    fab:             { position: 'absolute', bottom: 64, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.textPrimary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 28, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    fabLabel:        { fontSize: 14, fontWeight: '600', color: COLORS.bg },
  
    // multi-select bar
    multiBar:        { position: 'absolute', bottom: 56, left: 16, right: 16, backgroundColor: COLORS.bgElevated, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border, elevation: 8 },
    multiCount:      { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
    multiActions:    { flexDirection: 'row', gap: 16 },
    multiBtn:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
    multiBtnLabel:   { fontSize: 13, fontWeight: '500' },
  
    // bottom nav
    bottomNav:       { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.bg, borderTopWidth: 0.5, borderTopColor: COLORS.border, paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8 },
    navItem:         { flex: 1, alignItems: 'center', gap: 2 },
    navLabel:        { fontSize: 10, color: COLORS.textTertiary },
    navLabelActive:  { color: COLORS.textPrimary },
  
    // action sheet
    backdrop:        { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },
    sheet:           { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.bgElevated, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 16 },
    sheetHeader:     { flexDirection: 'row', alignItems: 'center', padding: 16 },
    sheetFileName:   { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    sheetFileMeta:   { fontSize: 11, color: COLORS.textTertiary, marginTop: 2 },
    sheetDivider:    { height: 0.5, backgroundColor: COLORS.border, marginHorizontal: 16 },
    sheetAction:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
    sheetActionLabel:{ fontSize: 15, fontWeight: '500' },
    renameRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    renameInput:     { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 10, borderWidth: 0.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10, color: COLORS.textPrimary, fontSize: 14 },
    renameConfirm:   { paddingHorizontal: 12, paddingVertical: 10 },
  });