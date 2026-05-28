import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { Snippet } from '@/types/snippet';
import { theme } from '@/constants/theme';
import {
  ANTHROPIC_MODEL,
  type AiExplanationKind,
  callAnthropic,
  getAllCachedForSnippet,
  getApiKey,
  hashCode,
  parseImproveBullets,
  saveCachedExplanation,
  type CachedExplanation,
} from '@/utils/ai';

type AiExplanationPanelProps = {
  snippet: Snippet;
};

export function AiExplanationPanel({ snippet }: AiExplanationPanelProps) {
  const db = useSQLiteContext();
  const [cached, setCached] = useState<Record<AiExplanationKind, CachedExplanation | null>>({
    explain: null,
    summarize: null,
    improve: null,
  });
  const [activeKind, setActiveKind] = useState<AiExplanationKind>('explain');
  const [displayContent, setDisplayContent] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [codeHash, setCodeHash] = useState<string>('');
  const [stale, setStale] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshCache = useCallback(async () => {
    const hash = await hashCode(snippet.code);
    setCodeHash(hash);
    const rows = await getAllCachedForSnippet(db, snippet.id);
    const map: Record<AiExplanationKind, CachedExplanation | null> = {
      explain: null,
      summarize: null,
      improve: null,
    };
    for (const row of rows) {
      map[row.kind as AiExplanationKind] = row;
    }
    setCached(map);
    const key = await getApiKey();
    setHasKey(!!key);
    return { hash, map };
  }, [db, snippet.id, snippet.code]);

  const applyDisplay = useCallback(
    (kind: AiExplanationKind, map: Record<AiExplanationKind, CachedExplanation | null>, hash: string) => {
      const row = map[kind];
      if (!row) {
        setDisplayContent(null);
        setSuggestions([]);
        setStale(false);
        return;
      }
      if (row.code_hash !== hash) {
        setStale(true);
        setDisplayContent(row.content);
      } else {
        setStale(false);
        setDisplayContent(row.content);
      }
      const improveRow = map.improve;
      if (improveRow && improveRow.code_hash === hash) {
        setSuggestions(parseImproveBullets(improveRow.content));
      } else if (kind === 'improve' && row.code_hash === hash) {
        setSuggestions(parseImproveBullets(row.content));
      } else {
        setSuggestions([]);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      void refreshCache().then(({ hash, map }) => applyDisplay(activeKind, map, hash));
    }, [refreshCache, activeKind, applyDisplay])
  );

  const runAi = async (kind: AiExplanationKind, force = false) => {
    const key = await getApiKey();
    if (!key) return;

    const row = cached[kind];
    const hash = codeHash || (await hashCode(snippet.code));

    if (!force && row && row.code_hash === hash) {
      setActiveKind(kind);
      applyDisplay(kind, cached, hash);
      return;
    }

    if (!force && row && row.code_hash !== hash) {
      Alert.alert(
        'Code has changed',
        'Regenerate the AI explanation? This will use API credits.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Regenerate', onPress: () => runAi(kind, true) },
        ]
      );
      return;
    }

    setLoading(true);
    setActiveKind(kind);
    try {
      const content = await callAnthropic(kind, snippet.code, snippet.language);
      await saveCachedExplanation(db, snippet.id, kind, content, hash, ANTHROPIC_MODEL);
      const { map, hash: h } = await refreshCache();
      applyDisplay(kind, map, h);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'AI request failed';
      if (msg === 'NO_API_KEY') {
        setHasKey(false);
      } else {
        Alert.alert('AI error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeRow = cached[activeKind];
  const showCachedBadge = activeRow && activeRow.code_hash === codeHash && displayContent;

  if (hasKey === false) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.secLbl}>AI EXPLANATION</Text>
        <View style={styles.nudge}>
          <Ionicons name="key-outline" size={18} color={theme.textSecondary} />
          <Text style={styles.nudgeText}>
            Set your Anthropic API key in{' '}
            <Text
              style={styles.link}
              onPress={() => router.push('/(tabs)/settings')}
            >
              Settings
            </Text>{' '}
            to use AI explanations.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHdr}>
        <View style={styles.hdrLeft}>
          <Text style={styles.secLbl}>AI EXPLANATION</Text>
          {showCachedBadge ? (
            <View style={styles.cachedBadge}>
              <Text style={styles.cachedBadgeText}>cached</Text>
            </View>
          ) : null}
        </View>
        {displayContent ? (
          <TouchableOpacity
            onPress={() => {
              Alert.alert('Regenerate', 'Fetch a fresh AI response?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Regenerate', onPress: () => runAi(activeKind, true) },
              ]);
            }}
          >
            <View style={styles.regen}>
              <Ionicons name="refresh" size={12} color={theme.textInfo} />
              <Text style={styles.regenText}>regenerate</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>

      {stale ? (
        <TouchableOpacity
          style={styles.staleBanner}
          onPress={() => runAi(activeKind, true)}
        >
          <Text style={styles.staleText}>Code has changed — regenerate?</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderLeft}>
            <View style={styles.dot} />
            <Text style={styles.panelTitle}>AI — {ANTHROPIC_MODEL.split('-').slice(0, 2).join('-')}</Text>
          </View>
          {activeRow ? (
            <Text style={styles.panelDate}>
              {format(new Date(activeRow.created_at), 'MMM d, yyyy')}
            </Text>
          ) : null}
        </View>

        <View style={styles.panelBody}>
          {loading ? (
            <ActivityIndicator color={theme.textSecondary} style={{ padding: 16 }} />
          ) : displayContent ? (
            <>
              <View style={styles.aiSection}>
                <View style={styles.aiSecTitle}>
                  <Ionicons name="bulb-outline" size={12} color={theme.textSecondary} />
                  <Text style={styles.aiSecTitleText}>
                    {activeKind === 'improve' ? 'Suggestions' : 'Explanation'}
                  </Text>
                </View>
                {activeKind === 'improve' || suggestions.length > 0 ? (
                  suggestions.map((s) => (
                    <View key={s} style={styles.bulletRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.aiText}>{s}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.aiText}>{displayContent}</Text>
                )}
              </View>
              {activeKind !== 'improve' && suggestions.length > 0 ? (
                <View style={styles.aiSection}>
                  <View style={styles.aiSecTitle}>
                    <Ionicons name="list-outline" size={12} color={theme.textSecondary} />
                    <Text style={styles.aiSecTitleText}>Suggestions</Text>
                  </View>
                  {suggestions.map((s) => (
                    <View key={s} style={styles.bulletRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.aiText}>{s}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyAi}>
              Tap Explain, Summarise, or Improve to generate an AI response.
            </Text>
          )}
        </View>

        <View style={styles.btnRow}>
          {(['explain', 'summarize', 'improve'] as const).map((kind, i) => (
            <TouchableOpacity
              key={kind}
              style={[styles.aiBtn, i === 0 && styles.aiBtnPrimary]}
              onPress={() => runAi(kind)}
              disabled={loading}
            >
              <Ionicons
                name={kind === 'explain' ? 'sparkles' : kind === 'summarize' ? 'reader-outline' : 'trending-up-outline'}
                size={12}
                color={theme.textSecondary}
              />
              <Text style={styles.aiBtnText}>
                {kind === 'explain' ? 'Explain' : kind === 'summarize' ? 'Summarise' : 'Improve'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
  hdrLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.textSecondary,
    letterSpacing: 0.5,
  },
  cachedBadge: {
    backgroundColor: '#E1F5EE',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: '#9FE1CB',
  },
  cachedBadgeText: { fontSize: 9, color: '#085041', fontWeight: '600' },
  regen: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regenText: { fontSize: 12, color: theme.textInfo },
  staleBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    backgroundColor: '#FAEEDA',
    borderRadius: 8,
  },
  staleText: { fontSize: 12, color: '#633806', textAlign: 'center' },
  panel: {
    marginHorizontal: 16,
    borderWidth: 0.5,
    borderColor: theme.borderTertiary,
    borderRadius: 10,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.bgSecondary,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.borderTertiary,
  },
  panelHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1D9E75' },
  panelTitle: { fontSize: 12, fontWeight: '500', color: theme.textPrimary },
  panelDate: { fontSize: 10, color: theme.textTertiary },
  panelBody: { padding: 10 },
  aiSection: { marginBottom: 10 },
  aiSecTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  aiSecTitleText: { fontSize: 11, fontWeight: '600', color: theme.textSecondary },
  aiText: { fontSize: 12, color: theme.textSecondary, lineHeight: 18, flex: 1 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1D9E75',
    marginTop: 6,
  },
  emptyAi: { fontSize: 12, color: theme.textTertiary, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 8, padding: 10, paddingTop: 0 },
  aiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: theme.borderSecondary,
  },
  aiBtnPrimary: { backgroundColor: theme.bgSecondary },
  aiBtnText: { fontSize: 11, fontWeight: '500', color: theme.textSecondary },
  nudge: {
    marginHorizontal: 16,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: theme.bgSecondary,
    borderRadius: 10,
    alignItems: 'flex-start',
  },
  nudgeText: { flex: 1, fontSize: 13, color: theme.textSecondary, lineHeight: 20 },
  link: { color: theme.textInfo, fontWeight: '600' },
});
