'use client';

import { cn } from '@/lib/utils';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  minHeight?: string;
}

export const MarkdownEditor = ({
  value,
  onChange,
  placeholder = 'Write something...',
  label,
  error,
  minHeight = '200px',
}: MarkdownEditorProps) => {
  const editorId = label?.toLowerCase().replace(/\s+/g, '-');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'p-4 prose prose-sm max-w-none focus:outline-none',
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div>
      {label && (
        <label htmlFor={editorId} className="block text-sm font-bold text-gray-800 mb-1">
          {label}
        </label>
      )}
      <div
        className={cn(
          'border-2 border-gray-800 rounded-md shadow-brutal-sm overflow-hidden',
          editor.isFocused && 'border-primary-600 shadow-brutal-primary',
          error && 'border-red-600',
        )}
      >
        {/* Toolbar */}
        <div className="border-b-2 border-gray-800 bg-gray-50 p-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-1.5 rounded border-2 border-gray-800 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm font-bold',
              editor.isActive('bold')
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'p-1.5 rounded border-2 border-gray-800 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm italic',
              editor.isActive('italic')
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            I
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'p-1.5 rounded border-2 border-gray-800 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm font-bold',
              editor.isActive('heading', { level: 2 })
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              'p-1.5 rounded border-2 border-gray-800 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm font-bold',
              editor.isActive('heading', { level: 3 })
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            H3
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-1.5 rounded border-2 border-gray-800 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm',
              editor.isActive('bulletList')
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-1.5 rounded border-2 border-gray-800 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm',
              editor.isActive('orderedList')
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            1.
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'p-1.5 rounded border-2 border-gray-800 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm',
              editor.isActive('blockquote')
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            &gt;
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={cn(
              'p-1.5 rounded border-2 border-gray-800 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm font-mono',
              editor.isActive('code')
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            &lt;/&gt;
          </button>
          <button
            type="button"
            onClick={setLink}
            className={cn(
              'p-1.5 rounded border-2 border-gray-800 shadow-brutal-sm hover:shadow-brutal-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-none transition-all text-sm',
              editor.isActive('link')
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100',
            )}
          >
            Link
          </button>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} style={{ minHeight }} />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
