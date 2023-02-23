export interface DirectUpload {
  status: 'started' | 'processing' | 'preparing' | 'completed' | 'canceled';
  percentage: number;
}

export interface DirectUploadPulicAssetRes extends DirectUpload {
  publicUrl?: string;
}

export interface GeneralUploadRes extends DirectUpload {
  keyForSignApi: string; // use for sign api
  fileKey: string; // use for download api
}

export interface TempUploadRes extends DirectUpload {
  tempKey: string; // key contain `temp` prefix and can download by general download api
  key: string; //original key without `temp` prefix and can only download with temp download api
  region: string;
  bucket: string;
  scanId?: number;
}

export enum ScaningStatus {
  scanning = 'scanning',
  infected = 'infected',
  clean = 'clean',
  failed = 'failed'
}
