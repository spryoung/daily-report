import type { ReportsData } from '../types';

const EMPTY: ReportsData = { daily: {}, weekly: {} };

export async function loadFromStorage(): Promise<ReportsData> {
  try {
    const res = await fetch('/api/reports')
    if (res.ok) return await res.json() as ReportsData
  } catch {
    // fallback
  }
  return EMPTY
}

export function saveToStorage(data: ReportsData): void {
  fetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).catch(() => {})
}

export async function exportToFile(data: ReportsData): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
        suggestedName: 'reports.json',
        types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'reports.json';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromFile(): Promise<ReportsData | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string) as ReportsData;
          resolve(data);
        } catch {
          resolve(null);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
