'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AiMarkdownProps {
  content: string;
  compact?: boolean;
}

export function AiMarkdown({ content, compact = false }: AiMarkdownProps) {
  return (
    <div className={`prose ${compact ? 'prose-xs' : 'prose-sm'} max-w-none text-gray-900 prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-blockquote:my-2`}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
