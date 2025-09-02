'use client';

import { useState, useRef, useEffect } from 'react';
import { Edit3, Check, X, Save } from 'lucide-react';

interface InlineEditorProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: 'text' | 'textarea' | 'number' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  multiline?: boolean;
}

export function InlineEditor({
  value,
  onSave,
  type = 'text',
  options = [],
  placeholder = 'Klik for at redigere...',
  className = '',
  displayClassName = '',
  multiline = false,
}: InlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'number') {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, type]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={handleEdit}
        className={`group relative inline-flex items-center gap-2 text-left w-full min-h-[1.5rem] rounded-md hover:bg-gray-50 transition-colors ${displayClassName}`}
      >
        <span className={value ? '' : 'text-gray-400 italic'}>
          {value || placeholder}
        </span>
        <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {type === 'select' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSaving}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' || multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
          disabled={isSaving}
          placeholder={placeholder}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSaving}
          placeholder={placeholder}
        />
      )}
      
      <div className="flex gap-1">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          title="Gem (Enter)"
        >
          {isSaving ? (
            <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
          ) : (
            <Check className="h-3 w-3" />
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1 rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          title="Annuller (Escape)"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

interface RichTextInlineEditorProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export function RichTextInlineEditor({
  value,
  onSave,
  placeholder = 'Klik for at redigere beskrivelsen...',
  className = '',
}: RichTextInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditValue(value);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value);
  };

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        onClick={handleEdit}
        className={`group relative text-left w-full rounded-md hover:bg-gray-50 transition-colors p-2 ${className}`}
      >
        {value ? (
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <span className="text-gray-400 italic">{placeholder}</span>
        )}
        <Edit3 className="absolute top-2 right-2 h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <textarea
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        className="w-full h-32 px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
        placeholder={placeholder}
        disabled={isSaving}
      />
      <div className="flex gap-2 justify-end">
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="px-3 py-1 rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
        >
          Annuller
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-1"
        >
          {isSaving ? (
            <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          Gem
        </button>
      </div>
    </div>
  );
}
