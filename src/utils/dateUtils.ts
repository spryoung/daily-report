import {
  format,
  getISOWeek,
  getYear,
  startOfISOWeek,
  endOfISOWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function toWeekKey(date: Date): string {
  const year = getYear(startOfISOWeek(date));
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

export function getWeekBounds(date: Date): { start: Date; end: Date } {
  return {
    start: startOfISOWeek(date),
    end: endOfISOWeek(date),
  };
}

export function formatDisplayDate(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy年M月d日 EEEE', { locale: zhCN });
}

export function formatWeekDisplay(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split('-W');
  return `${yearStr}年 第${parseInt(weekStr)}周`;
}

export function getCalendarDays(month: Date): Date[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  return eachDayOfInterval({ start, end });
}

export {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
  startOfISOWeek,
  endOfISOWeek,
  getISOWeek,
  getYear,
};
