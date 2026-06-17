export interface DailyReport {
  date: string; // YYYY-MM-DD
  content: string;
  updatedAt: string;
}

export interface WeeklyReport {
  weekKey: string; // YYYY-WXX  e.g. 2026-W25
  year: number;
  week: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  content: string;
  updatedAt: string;
}

export interface ReportsData {
  daily: Record<string, DailyReport>;
  weekly: Record<string, WeeklyReport>;
}

export type ViewMode = 'daily' | 'weekly';
