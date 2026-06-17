import { useState, useEffect, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { useReports } from '../context/ReportsContext';
import {
  toWeekKey,
  formatWeekDisplay,
  toDateString,
  getWeekBounds,
  format,
} from '../utils/dateUtils';
import { marked } from 'marked';

interface WeeklyEditorProps {
  selectedWeek: Date;
}

export default function WeeklyEditor({ selectedWeek }: WeeklyEditorProps) {
  const { data, saveWeekly } = useReports();
  const weekKey = toWeekKey(selectedWeek);

  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    const existing = data.weekly[weekKey]?.content ?? '';
    setContent(existing);
    setSaved(true);
  }, [weekKey, data.weekly]);

  const handleChange = (val?: string) => {
    setContent(val ?? '');
    setSaved(false);
  };

  const handleSave = useCallback(() => {
    const { start, end } = getWeekBounds(selectedWeek);
    saveWeekly({
      weekKey,
      year: selectedWeek.getFullYear(),
      week: parseInt(weekKey.split('-W')[1]),
      startDate: toDateString(start),
      endDate: toDateString(end),
      content,
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
  }, [weekKey, content, saveWeekly, selectedWeek]);

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

  const getDailyReportsForWeek = () => {
    const { start } = getWeekBounds(selectedWeek);
    const days: { date: string; content: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = toDateString(d);
      const report = data.daily[key];
      if (report?.content?.trim()) {
        days.push({ date: key, content: report.content });
      }
    }
    return days;
  };

  const dailyReports = getDailyReportsForWeek();

  const generateDraft = () => {
    if (dailyReports.length === 0) return;
    setGenerating(true);

    const { start, end } = getWeekBounds(selectedWeek);
    const weekLabel = formatWeekDisplay(weekKey);
    const dateRange = `${format(start, 'M月d日')} — ${format(end, 'M月d日')}`;

    const isoWeekDay: Record<string, string> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      isoWeekDay[toDateString(d)] = dayNames[i];
    }

    const dailySection = dailyReports
      .map(({ date, content }) => {
        const dayName = isoWeekDay[date] ?? date;
        return `### ${dayName}（${date}）\n\n${content.trim()}`;
      })
      .join('\n\n---\n\n');

    const draft = `# ${weekLabel} 周报\n\n**时间范围：** ${dateRange}\n\n## 本周工作内容\n\n${dailySection}\n\n---\n\n## 本周总结\n\n> （请在此填写本周总结）\n\n## 下周计划\n\n> （请在此填写下周计划）\n`;

    setContent(draft);
    setSaved(false);
    setGenerating(false);
  };

  const htmlContent = previewMode === 'preview' ? marked.parse(content) as string : '';

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-title-group">
          <h2 className="editor-title">{formatWeekDisplay(weekKey)}</h2>
          <span className="week-sub">
            {(() => {
              const { start, end } = getWeekBounds(selectedWeek);
              return `${format(start, 'M月d日')} — ${format(end, 'M月d日')}`;
            })()}
          </span>
        </div>
        <div className="editor-actions">
          <span className={`save-status ${saved ? 'saved' : 'unsaved'}`}>
            {saved ? (data.weekly[weekKey] ? '已保存' : '') : '未保存'}
          </span>
          <button
            className="btn-secondary"
            onClick={generateDraft}
            disabled={generating || dailyReports.length === 0}
            title={dailyReports.length === 0 ? '本周没有日报' : '从日报汇总生成周报草稿'}
          >
            {generating ? '生成中...' : `从日报生成草稿（${dailyReports.length}天）`}
          </button>
          <div className="preview-toggle">
            <button
              className={`toggle-btn ${previewMode === 'edit' ? 'active' : ''}`}
              onClick={() => setPreviewMode('edit')}
            >编辑</button>
            <button
              className={`toggle-btn ${previewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setPreviewMode('preview')}
            >预览</button>
          </div>
          <button className="btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>

      {previewMode === 'edit' ? (
        <div className="md-editor-wrapper" data-color-mode="light">
          <MDEditor
            value={content}
            onChange={handleChange}
            preview="edit"
            height="calc(100vh - 180px)"
            visibleDragbar={false}
          />
        </div>
      ) : (
        <div className="preview-pane markdown-body">
          {content ? (
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : (
            <p className="empty-hint">暂无内容，切换到编辑模式开始写作</p>
          )}
        </div>
      )}

      <div className="editor-footer">
        <span className="shortcut-hint">⌘S 快速保存</span>
        {dailyReports.length === 0 && (
          <span className="warn-hint">本周暂无日报，可以先写日报再生成草稿</span>
        )}
        <span className="char-count">{content.length} 字符</span>
      </div>
    </div>
  );
}
