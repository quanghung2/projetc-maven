export enum ROUTE_LINK {
  call_recording = 'recordings',
  voicemail = 'voicemails',
  report = 'report',
  pending_jobs = 'pendingJobs',
  permission = 'permission'
}

export enum FILE_TYPE {
  recordings = 'recordings',
  voicemails = 'voicemails'
}

export enum TITLE {
  recordings = 'Call Recording',
  voicemails = 'Voicemail'
}

export const TRASH_BIN = '_trashbin';

export interface CursorCaching {
  pageIndex: number;
  cursor: string;
}
