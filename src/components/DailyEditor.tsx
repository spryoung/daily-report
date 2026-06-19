import { useState, useEffect, useCallback } from 'react';
import { useReports } from '../context/ReportsContext';
import { formatDisplayDate, toDateString } from '../utils/dateUtils';

interface DailyEditorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export default function DailyEditor({ selectedDate, setSelectedDate }: DailyEditorProps) {
  const { data, saveDaily } = useReports();
  const dateKey = toDateString(selectedDate);

  const sortedDates = Object.keys(data.daily)
    .filter(k => data.daily[k]?.content?.trim())
    .sort();
  const currentIndex = sortedDates.indexOf(dateKey);

  const todayKey = toDateString(new Date());

  const goTo = (key: string) => setSelectedDate(new Date(key + 'T12:00:00'));

  const goPrev = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    goTo(toDateString(prev));
  };
  const goNext = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    goTo(toDateString(next));
  };
  const goLatest = () => goTo(todayKey);

  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(true);
  const [lastSavedKey, setLastSavedKey] = useState('');

  useEffect(() => {
    const existing = data.daily[dateKey]?.content ?? '';
    setContent(existing);
    setSaved(true);
    setLastSavedKey(dateKey);
  }, [dateKey, data.daily]);

  const handleChange = (val: string) => {
    setContent(val);
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
      <div className="daily-nav-bar">
        <button className="nav-report-btn" onClick={goPrev}>
          ‹ 上一封
        </button>
        <button className="nav-report-btn" onClick={goNext} disabled={dateKey >= todayKey}>
          下一封 ›
        </button>
        <button className="nav-report-btn" onClick={goLatest} disabled={dateKey === todayKey}>
          最新日报
        </button>
      </div>
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

      <div className="daily-textarea-wrapper">
        <textarea
          className="daily-textarea"
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder="记录今天的工作..."
          spellCheck={false}
        />
      </div>

      <div className="editor-footer">
        <span className="shortcut-hint">⌘S 快速保存</span>
        <span className="char-count">{content.length} 字符</span>
      </div>
    </div>
  );
}
