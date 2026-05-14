export interface UserSettings {
  userId: string;
  roofArea: number;
  tankCapacity: number;
}

export interface RainfallEntry {
  id: string;
  amountMm: number;
  waterCollected: number;
  date: string;
}

export type ViewState = 'setup' | 'dashboard' | 'history' | 'tips' | 'loading' | 'auth';
