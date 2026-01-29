// src/api/myPage/types.ts

export type ApiEnvelope<T> = {
  status?: boolean;
  code: number | string;
  message: string;
  data: T | null;
};

export type ScrapRowApi = {
  id: number;
  uid: number;
  pid: number | string;
  createdAt: string;
};
