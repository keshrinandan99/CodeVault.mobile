export function toHighlightLanguage(language: string): string {
  const map: Record<string, string> = {
    TypeScript: 'typescript',
    JavaScript: 'javascript',
    Javascript: 'javascript',
    Python: 'python',
    Shell: 'bash',
    SQL: 'sql',
  };
  return map[language] ?? 'plaintext';
}
