declare module 'lowlight' {
  export type HastNode = {
    type: string;
    value?: string;
    tagName?: string;
    properties?: { className?: string[] };
    children?: HastNode[];
  };

  export type HighlightResult = { value: HastNode[] };

  interface Lowlight {
    highlight(language: string, value: string): HighlightResult;
    highlightAuto(value: string): HighlightResult;
    registerLanguage(name: string, syntax: unknown): void;
    listLanguages(): string[];
  }

  const low: Lowlight;
  export default low;
}
