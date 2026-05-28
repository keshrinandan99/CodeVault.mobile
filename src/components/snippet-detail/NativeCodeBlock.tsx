import React from 'react';
import { Platform, Text, type TextStyle } from 'react-native';
import low from 'lowlight';
import { buildColorMap, getDefaultCodeColor } from './codeTheme';
import { toHighlightLanguage } from '@/utils/highlightLanguage';

type HastNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: string[] };
  children?: HastNode[];
};

type NativeCodeBlockProps = {
  code: string;
  language: string;
  hlTheme: Record<string, { color?: string; fontStyle?: string; fontWeight?: string }>;
  fontSize?: number;
  fontFamily?: string;
};

function mergeClassStyle(
  classNames: string[] | undefined,
  colorMap: ReturnType<typeof buildColorMap>,
  base: TextStyle
): TextStyle {
  let style: TextStyle = { ...base };
  if (!classNames?.length) return style;
  for (const cn of classNames) {
    const extra = colorMap[cn];
    if (extra) style = { ...style, ...extra };
  }
  return style;
}

function renderNodes(
  nodes: HastNode[],
  colorMap: ReturnType<typeof buildColorMap>,
  baseStyle: TextStyle,
  keyPath: string
): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPath}-${index}`;
    if (node.type === 'text') {
      return (
        <Text key={key} style={baseStyle}>
          {node.value}
        </Text>
      );
    }
    if (node.type === 'element' && node.children?.length) {
      const style = mergeClassStyle(node.properties?.className, colorMap, baseStyle);
      return (
        <Text key={key} style={style}>
          {renderNodes(node.children, colorMap, style, key)}
        </Text>
      );
    }
    return null;
  });
}

export function NativeCodeBlock({
  code,
  language,
  hlTheme,
  fontSize = 12,
  fontFamily = Platform.OS === 'ios' ? 'Menlo' : 'monospace',
}: NativeCodeBlockProps) {
  const hlLang = toHighlightLanguage(language);
  const colorMap = buildColorMap(hlTheme);
  const defaultColor = getDefaultCodeColor(hlTheme);

  let nodes: HastNode[];
  try {
    nodes = low.highlight(hlLang, code).value as HastNode[];
  } catch {
    try {
      nodes = low.highlightAuto(code).value as HastNode[];
    } catch {
      nodes = [{ type: 'text', value: code }];
    }
  }

  const baseStyle: TextStyle = {
    fontFamily,
    fontSize,
    color: defaultColor,
    lineHeight: Math.round(fontSize * 1.55),
  };

  return <Text style={baseStyle}>{renderNodes(nodes, colorMap, baseStyle, 'code')}</Text>;
}
