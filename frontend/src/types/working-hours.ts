export interface WorkingHour {
  id: string;
  adminId: string;
  dayOfWeek: number; // 1 = Monday ... 7 = Sunday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isClosed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddWorkingHourInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

export interface UpdateWorkingHourInput {
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  isClosed?: boolean;
}

export interface SpecialHour {
  id: string;
  adminId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string | null; // HH:mm or null for full-day closure
  endTime?: string | null; // HH:mm or null for full-day closure
  createdAt?: string;
  updatedAt?: string;
}

export interface AddSpecialHourInput {
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
}

export interface UpdateSpecialHourInput {
  startDate?: string;
  endDate?: string;
  startTime?: string | null;
  endTime?: string | null;
}
