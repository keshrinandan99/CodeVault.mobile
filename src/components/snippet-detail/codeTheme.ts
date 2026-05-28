// @ts-expect-error — hljs style modules lack types
import atomOneDark from 'react-syntax-highlighter/dist/cjs/styles/hljs/atom-one-dark';
// @ts-expect-error
import githubGist from 'react-syntax-highlighter/dist/cjs/styles/hljs/github-gist';

type HljsStyleEntry = { color?: string; fontStyle?: string; fontWeight?: string };

export function getCodeTheme(isDark: boolean) {
  return isDark ? atomOneDark : githubGist;
}

export function buildColorMap(
  theme: Record<string, HljsStyleEntry>
): Record<string, { color?: string; fontStyle?: 'italic' | 'normal'; fontWeight?: 'bold' | 'normal' }> {
  const map: Record<string, { color?: string; fontStyle?: 'italic' | 'normal'; fontWeight?: 'bold' | 'normal' }> =
    {};
  for (const [key, entry] of Object.entries(theme)) {
    if (!entry?.color && !entry?.fontStyle && !entry?.fontWeight) continue;
    map[key] = {
      color: entry.color,
      fontStyle: entry.fontStyle === 'italic' ? 'italic' : undefined,
      fontWeight: entry.fontWeight === 'bold' ? 'bold' : undefined,
    };
  }
  return map;
}

export function getDefaultCodeColor(theme: Record<string, HljsStyleEntry>): string {
  const hljs = theme.hljs;
  return hljs?.color ?? '#4B5563';
}
