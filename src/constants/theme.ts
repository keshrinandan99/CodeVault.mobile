export const theme = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F8F9FA',
  bgElevated: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  textInfo: '#3B82F6',
  borderSecondary: '#E5E7EB',
  borderTertiary: '#F3F4F6',
  heartActive: '#E24B4A',
  shadow: 'rgba(17, 24, 39, 0.08)',
} as const;

export const LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Shell', 'SQL', 'Other'] as const;

export const getLanguageStyle = (lang: string) => {
  const map: Record<string, { bg: string; text: string }> = {
    JavaScript: { bg: '#FAEEDA', text: '#633806' },
    Javascript: { bg: '#FAEEDA', text: '#633806' },
    Python: { bg: '#E1F5EE', text: '#085041' },
    TypeScript: { bg: '#E6F1FB', text: '#0C447C' },
    Shell: { bg: '#F1EFE8', text: '#444441' },
    SQL: { bg: '#EDE9FE', text: '#5B21B6' },
  };
  return map[lang] ?? { bg: '#F3F4F6', text: '#374151' };
};
