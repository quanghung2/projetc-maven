export interface FileState {
  fileExplorer: FileExplorer;
}

export class FileInfo {
  name: string;
  key: string;
  last_modified: string;
  size: string;
  type?: string;
  path?: string;
  isDirectory?: boolean;
}

export class Folder {
  name: string;
  path: string;
  isChecked?: boolean;
}

export class FileInfoResponse {
  files: FileInfo[] = [];
  folders: Folder[] = [];
  next_token: string;
  count: number;

  get result(): Array<FileInfo | Folder> {
    let result: Array<FileInfo | Folder> = [];
    result = result.concat(this.folders);
    result = result.concat(this.files);
    return result;
  }
}

export class FileResponExplorer {
  nextCursor: string;
  entries: FileEntry[];

  constructor(obj: Partial<FileResponExplorer>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class FileEntry {
  name: string;
  fileKey: string;
  size: number;
  lastModified: number;
  isDirectory: boolean;
}

export interface RequestUploadData {
  chatUserId: string;
  orgUuid: string;
  wssToken: string;
  chatServer: string;
  convoType: string;
  hyperspaceId: string;
  mediaOrgUuid: string; // ns of msg
}

export class JobDetailModel {
  jobId?: string | number;
  type: string;
  result: string;
  prefixes: string[];

  constructor(obj: Partial<JobDetailModel>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface FileExplorer {
  dateRecording?: string;
  nextCursorRecording?: string;
  dateVoicemail?: string;
  nextCursorVoicemail?: string;
  dateName?: string;
  type?: string;
  titleFolder?: string;
  titleFile?: string;
  isFolder?: boolean;
  isFirstLoad?: boolean;
  isTrashBin?: boolean;
}

export class JobResponse {
  jobs: JobInfo[];

  constructor(obj: Partial<JobResponse>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface JobInfo {
  jobId: string | number;
  type: string;
  status?: string;
}

export interface StorageFileInfo {
  size: number;
  contentType: string;
  lastModified: number;
}

export class UploadModel {
  public dialogTitle = 'Upload a file';
  public fileName: string;
  public filePath = '';
  public fileSize = 0;
  public width = 0;
  public height = 0;
  public lastModified = 0;
  public file: File;
  public isImage = false;
  public uploading = false;
  public uploadPercentage = 0;
  public index: number;
}

export interface DownloadFileV3Req {
  sharingOrgUuid?: string;
}
