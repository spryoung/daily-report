import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReportsData, DailyReport, WeeklyReport } from '../types';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';

type Action =
  | { type: 'SAVE_DAILY'; payload: DailyReport }
  | { type: 'SAVE_WEEKLY'; payload: WeeklyReport }
  | { type: 'IMPORT'; payload: ReportsData };

function reducer(state: ReportsData, action: Action): ReportsData {
  switch (action.type) {
    case 'SAVE_DAILY':
      return {
        ...state,
        daily: { ...state.daily, [action.payload.date]: action.payload },
      };
    case 'SAVE_WEEKLY':
      return {
        ...state,
        weekly: { ...state.weekly, [action.payload.weekKey]: action.payload },
      };
    case 'IMPORT':
      return action.payload;
    default:
      return state;
  }
}

interface ReportsContextValue {
  data: ReportsData;
  saveDaily: (report: DailyReport) => void;
  saveWeekly: (report: WeeklyReport) => void;
  importData: (data: ReportsData) => void;
}

const ReportsContext = createContext<ReportsContextValue | null>(null);

export function ReportsProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, loadFromLocalStorage);

  useEffect(() => {
    saveToLocalStorage(data);
  }, [data]);

  const saveDaily = (report: DailyReport) => dispatch({ type: 'SAVE_DAILY', payload: report });
  const saveWeekly = (report: WeeklyReport) => dispatch({ type: 'SAVE_WEEKLY', payload: report });
  const importData = (d: ReportsData) => dispatch({ type: 'IMPORT', payload: d });

  return (
    <ReportsContext.Provider value={{ data, saveDaily, saveWeekly, importData }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
