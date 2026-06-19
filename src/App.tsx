import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DailyEditor from './components/DailyEditor';
import WeeklyEditor from './components/WeeklyEditor';
import { ReportsProvider, useReports } from './context/ReportsContext';
import { exportToFile, importFromFile } from './utils/storage';
import type { ViewMode } from './types';
import './App.css';

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return [dark, setDark] as const;
}

function AppContent() {
  const { data, importData } = useReports();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedWeek, setSelectedWeek] = useState(() => new Date());
  const [dark, setDark] = useDarkMode();

  const handleExport = async () => {
    await exportToFile(data);
  };

  const handleImport = async () => {
    const imported = await importFromFile();
    if (imported) importData(imported);
  };

  return (
    <div className="app-layout">
      <Sidebar
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        dark={dark}
        toggleDark={() => setDark(d => !d)}
      />
      <main className="main-content">
        <div className="toolbar">
          <button className="tool-btn" onClick={handleExport} title="导出数据为 JSON 文件">
            ↑ 导出
          </button>
          <button className="tool-btn" onClick={handleImport} title="从 JSON 文件导入数据">
            ↓ 导入
          </button>
        </div>
        {viewMode === 'daily' ? (
          <DailyEditor selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        ) : (
          <WeeklyEditor selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ReportsProvider>
      <AppContent />
    </ReportsProvider>
  );
}
