export type Snippet = {
  id: string;
  title: string;
  language: string;
  code: string;
  tag: string[];
  create_at: Date;
  updated_at?: Date;
  is_favourite: boolean;
  is_pinned: number;
};
