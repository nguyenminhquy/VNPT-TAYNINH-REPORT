'use client';

import React, { useCallback, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { ProtectedHeader } from './extensions/ProtectedHeader';
import { ProtectedSignature } from './extensions/ProtectedSignature';
import { documentTemplates } from '../templates';

import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Save, Printer, Download, List, ListOrdered, FileDown
} from 'lucide-react';

import './DocumentEditor.css';

interface DocumentEditorProps {
  initialContent?: string;
  onSave?: (html: string) => void;
  title?: string;
}

export default function DocumentEditor({ initialContent, onSave, title = 'Văn bản chưa đặt tên' }: DocumentEditorProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('to_trinh');
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      ProtectedHeader,
      ProtectedSignature,
    ],
    content: initialContent || documentTemplates[selectedTemplateKey].html,
    editorProps: {
      attributes: {
        class: 'a4-paper',
      },
    },
  });

  const handleSave = () => {
    if (editor && onSave) {
      onSave(editor.getHTML());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = async () => {
    if (!editor) return;
    try {
      setIsExporting(true);
      const html = editor.getHTML();
      
      const response = await fetch('/api/export-word-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: html,
          title: title
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate Word document');
      }

      // Download the blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_') || 'Van_ban'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error exporting word:', error);
      alert('Có lỗi xảy ra khi xuất file Word. Vui lòng thử lại.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newKey = e.target.value;
    setSelectedTemplateKey(newKey);
    if (editor) {
      if (confirm('Thay đổi mẫu sẽ xóa toàn bộ nội dung hiện tại. Bạn có chắc chắn muốn đổi không?')) {
        editor.commands.setContent(documentTemplates[newKey].html);
      } else {
        // revert select
        e.target.value = selectedTemplateKey;
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="document-editor-container">
      <div className="editor-header">
        <h2 className="editor-title">
          <select 
            value={selectedTemplateKey} 
            onChange={handleTemplateChange}
            style={{ fontSize: '1.2rem', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}
          >
            {Object.entries(documentTemplates).map(([key, t]) => (
              <option key={key} value={key}>{t.name}</option>
            ))}
          </select>
        </h2>
        <div className="editor-actions">
          <button onClick={handleSave} className="btn-action primary"><Save size={16} /> Lưu</button>
          <button onClick={handlePrint} className="btn-action"><Printer size={16} /> In / PDF</button>
          <button onClick={handleExportWord} disabled={isExporting} className="btn-action">
            <FileDown size={16} /> {isExporting ? 'Đang xuất...' : 'Xuất Word'}
          </button>
        </div>
      </div>
      
      <div className="editor-toolbar">
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Hoàn tác"><Undo size={16} /></button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Làm lại"><Redo size={16} /></button>
        
        <div className="toolbar-divider" />
        
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'active' : ''}><Bold size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'active' : ''}><Italic size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'active' : ''}><UnderlineIcon size={16} /></button>
        
        <div className="toolbar-divider" />
        
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? 'active' : ''}><AlignLeft size={16} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? 'active' : ''}><AlignCenter size={16} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? 'active' : ''}><AlignRight size={16} /></button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}><AlignJustify size={16} /></button>
        
        <div className="toolbar-divider" />
        
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'active' : ''}><List size={16} /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'active' : ''}><ListOrdered size={16} /></button>
      </div>

      <div className="editor-workspace">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
