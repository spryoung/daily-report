import { useState, useEffect, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useReports } from '../context/ReportsContext';
import { formatDisplayDate, toDateString } from '../utils/dateUtils';

interface DailyEditorProps {
  selectedDate: Date;
}

export default function DailyEditor({ selectedDate }: DailyEditorProps) {
  const { data, saveDaily } = useReports();
  const dateKey = toDateString(selectedDate);

  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(true);
  const [lastSavedKey, setLastSavedKey] = useState('');

  useEffect(() => {
    const existing = data.daily[dateKey]?.content ?? '';
    setContent(existing);
    setSaved(true);
    setLastSavedKey(dateKey);
  }, [dateKey, data.daily]);

  const handleChange = (val?: string) => {
    setContent(val ?? '');
    setSaved(false);
  };

  const handleSave = useCallback(() => {
    saveDaily({
      date: dateKey,
      content,
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setLastSavedKey(dateKey);
  }, [dateKey, content, saveDaily]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const isToday = dateKey === toDateString(new Date());

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-title-group">
          <h2 className="editor-title">{formatDisplayDate(dateKey)}</h2>
          {isToday && <span className="today-badge">今天</span>}
        </div>
        <div className="editor-actions">
          <span className={`save-status ${saved ? 'saved' : 'unsaved'}`}>
            {saved ? (lastSavedKey === dateKey && data.daily[dateKey] ? '已保存' : '') : '未保存'}
          </span>
          <button className="btn-primary" onClick={handleSave} disabled={saved && !!data.daily[dateKey]}>
            保存
          </button>
        </div>
      </div>

      <div className="md-editor-wrapper" data-color-mode="light">
        <MDEditor
          value={content}
          onChange={handleChange}
          preview="edit"
          height="calc(100vh - 180px)"
          visibleDragbar={false}
          className="md-editor"
        />
      </div>

      <div className="editor-footer">
        <span className="shortcut-hint">⌘S 快速保存</span>
        <span className="char-count">{content.length} 字符</span>
      </div>
    </div>
  );
}
