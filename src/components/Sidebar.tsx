import { useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  toDateString,
  getCalendarDays,
  addWeeks,
  subWeeks,
  getWeekBounds,
  toWeekKey,
  formatWeekDisplay,
} from '../utils/dateUtils';
import { useReports } from '../context/ReportsContext';
import type { ViewMode } from '../types';

interface SidebarProps {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  selectedWeek: Date;
  setSelectedWeek: (date: Date) => void;
}

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

export default function Sidebar({
  viewMode,
  setViewMode,
  selectedDate,
  setSelectedDate,
  selectedWeek,
  setSelectedWeek,
}: SidebarProps) {
  const { data } = useReports();
  const [displayMonth, setDisplayMonth] = useState(() => new Date());

  const calendarDays = getCalendarDays(displayMonth);

  const firstDayOfWeek = (calendarDays[0].getDay() + 6) % 7; // Mon=0
  const leadingBlanks = Array(firstDayOfWeek).fill(null);

  const handleDayClick = (day: Date) => {
    if (viewMode === 'daily') {
      setSelectedDate(day);
    } else {
      setSelectedWeek(day);
    }
  };

  const prevPeriod = () => {
    if (viewMode === 'daily') setDisplayMonth(subMonths(displayMonth, 1));
    else setSelectedWeek(subWeeks(selectedWeek, 1));
  };

  const nextPeriod = () => {
    if (viewMode === 'daily') setDisplayMonth(addMonths(displayMonth, 1));
    else setSelectedWeek(addWeeks(selectedWeek, 1));
  };

  const hasDailyReport = (day: Date) => {
    return !!data.daily[toDateString(day)]?.content?.trim();
  };

  const weekKey = toWeekKey(selectedWeek);
  const hasWeeklyReport = !!data.weekly[weekKey]?.content?.trim();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">日报 &amp; 周报</h1>
      </div>

      <div className="mode-tabs">
        <button
          className={`mode-tab ${viewMode === 'daily' ? 'active' : ''}`}
          onClick={() => setViewMode('daily')}
        >
          日报
        </button>
        <button
          className={`mode-tab ${viewMode === 'weekly' ? 'active' : ''}`}
          onClick={() => setViewMode('weekly')}
        >
          周报
        </button>
      </div>

      <div className="calendar">
        <div className="calendar-nav">
          <button className="nav-btn" onClick={prevPeriod}>‹</button>
          <span className="calendar-title">
            {viewMode === 'daily'
              ? format(displayMonth, 'yyyy年 M月')
              : formatWeekDisplay(weekKey)}
          </span>
          <button className="nav-btn" onClick={nextPeriod}>›</button>
        </div>

        {viewMode === 'daily' && (
          <>
            <div className="calendar-grid weekday-header">
              {WEEKDAY_LABELS.map((d) => (
                <span key={d} className="weekday-label">{d}</span>
              ))}
            </div>
            <div className="calendar-grid">
              {leadingBlanks.map((_, i) => (
                <span key={`blank-${i}`} />
              ))}
              {calendarDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const inMonth = isSameMonth(day, displayMonth);
                const hasReport = hasDailyReport(day);
                return (
                  <button
                    key={day.toISOString()}
                    className={[
                      'calendar-day',
                      isSelected ? 'selected' : '',
                      isToday ? 'today' : '',
                      !inMonth ? 'other-month' : '',
                    ].join(' ')}
                    onClick={() => handleDayClick(day)}
                  >
                    {day.getDate()}
                    {hasReport && <span className="dot" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {viewMode === 'weekly' && (
          <div className="week-info">
            {(() => {
              const { start, end } = getWeekBounds(selectedWeek);
              return (
                <div className={`week-range-card ${hasWeeklyReport ? 'has-report' : ''}`}>
                  <span className="week-range">
                    {format(start, 'M月d日')} — {format(end, 'M月d日')}
                  </span>
                  {hasWeeklyReport && <span className="week-dot">●</span>}
                </div>
              );
            })()}

            <div className="week-daily-list">
              {(() => {
                const { start } = getWeekBounds(selectedWeek);
                const days: Date[] = [];
                for (let i = 0; i < 7; i++) {
                  const d = new Date(start);
                  d.setDate(d.getDate() + i);
                  days.push(d);
                }
                const weekDayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                return days.map((d, i) => {
                  const key = toDateString(d);
                  const has = !!data.daily[key]?.content?.trim();
                  return (
                    <div key={key} className={`week-day-item ${has ? 'has-content' : ''}`}>
                      <span className="week-day-name">{weekDayNames[i]}</span>
                      <span className="week-day-date">{format(d, 'M/d')}</span>
                      {has && <span className="week-day-dot">✓</span>}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
