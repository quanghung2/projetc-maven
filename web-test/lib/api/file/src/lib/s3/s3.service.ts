import { HttpClient, HttpEventType, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { randomGuid } from '@b3networks/shared/common';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DirectUpload,
  DirectUploadPulicAssetRes,
  GeneralUploadRes,
  ScaningStatus,
  TempUploadRes
} from './direct-upload.model';

export const Status = {
  STARTED: 'started',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
  NONE: undefined
};

const MAX_FILE_SIZE = 1024 * 1024 * 1024;

export interface UploadEvent {
  status: string;
  percentage: number;
}

// You should verify with Toan and Stanley when you need to support one more. tks
export declare type GeneralUploadFolder =
  | 'support-center'
  | 'communication/tts'
  | 'uploads'
  | 'businessHub'
  | 'communication'
  | 'workspace';

interface DirectUploadOptions {
  tempFile: boolean;
  fileKeyPrefix?: string;
}

@Injectable({
  providedIn: 'root'
})
export class S3Service {
  constructor(private http: HttpClient) {}

  /**
   * Upload file to `uploads` folder and will live to user self delete
   *
   * *** PLEASE TRY WITH tempUpload IF IT'S POSSIBLE**
   *
   * Make sure you want keep this file PERMANENTLY when use this method, and insync with backend this file will be managed
   *
   * @param file
   * @param folder choice of the right folder for each app. You should verify with Toan and Stanley when you need to support one more. tks
   * @returns
   */
  // folder: communication/tts
  generalUpload(
    file: File | Blob,
    folder: GeneralUploadFolder = 'uploads',
    fileKeyPrefix?: string,
    params?: HttpParams
  ): Observable<GeneralUploadRes> {
    return this._directUpload<GeneralUploadRes>(file, folder, params, <DirectUploadOptions>{
      fileKeyPrefix: fileKeyPrefix
    });
  }

  /**
   * Upload to tempt folder and will delete within 24hrs by system
   * Should use for upload to process jobs (upload csv file to import, provision data)
   * @param file
   * @returns
   */
  tempUpload(file: File): Observable<TempUploadRes> {
    return this._directUpload<TempUploadRes>(file, null, null, <DirectUploadOptions>{ tempFile: true });
  }

  /**
   * Upload to tempt folder and will delete within 24hrs by system
   * Should use for upload to process jobs (upload csv file to import, provision data)
   * @param file
   * @returns
   */
  tempUploadWithAVScan(file: File): Observable<TempUploadRes> {
    if (file.size > MAX_FILE_SIZE) {
      return throwError(`Your proposed upload exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    const params = new HttpParams().set('asyncAvScan', true);
    return this._directUpload<TempUploadRes>(file, null, params, <DirectUploadOptions>{ tempFile: true });
  }

  scaningFileStatus(scanId: number) {
    return this.http
      .get<{ result: ScaningStatus }>(`file/public/v3/avScan/${scanId}`)
      .pipe(map(status => status?.result));
  }

  /**
   *
   * @param file file to upload
   * @param rootFolder  seperate file with app name
   * @param options {tempFile: boolean}. Temp file will be alive within 24hrs from uploaded.
   * Should use for upload to process jobs (upload csv file to import, provision data)
   * @returns
   */

  private _directUpload<T extends DirectUpload>(
    file: File | Blob,
    rootFolder: GeneralUploadFolder | undefined,
    params: HttpParams,
    options?: DirectUploadOptions
  ) {
    if (file.size > MAX_FILE_SIZE) {
      return throwError(`Your proposed upload exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    let key: string = options?.fileKeyPrefix || '';
    if (file instanceof File) {
      const fileFractionByDot = (<File>file).name.split('.');
      const fileName = fileFractionByDot[0];
      const fileExt = '.' + fileFractionByDot[fileFractionByDot.length - 1];
      key += fileName.replace(/[^a-zA-Z0-9-._/]/g, '') + '_' + new Date().getTime() + fileExt;
    } else if (file instanceof Blob) {
      key += new Date().getTime() + `/${randomGuid()}.json`;
    }

    let folder = `files/${rootFolder}`;
    if (options?.tempFile) {
      folder = 'temp';
    }

    return this.http
      .put<T>(`file/private/v3/${folder}/${key}`, file, {
        headers: { 'x-file-size': String(file.size) },
        observe: 'events',
        reportProgress: true,
        params: params
      })
      .pipe(
        map(event => {
          switch (event.type) {
            case HttpEventType.Sent:
              return <T>{ status: 'started', percentage: 0 };
            case HttpEventType.UploadProgress:
              return <T>{ status: 'processing', percentage: Math.round((100 * event.loaded) / event.total) };
            case HttpEventType.ResponseHeader:
            case HttpEventType.DownloadProgress:
              return <T>{ status: 'preparing', percentage: 100 };
            case HttpEventType.Response:
              return <T>{ status: 'completed', percentage: 100, ...event.body };
            default:
              return <T>{ status: 'completed', percentage: 100 };
          }
        })
      );
  }

  /**
   *
   * @param file upload file file with same path for now so it can reploace the old one. So you should ask customer to confirm before uploading.
   * @param type
   *
   * Supported type:
    - logo
    - favicon
    - avatar
    - flowicon

    Supported ext
    - jpg
    - jpeg
    - png
    - ico
   */
  directUploadPublicAsset(
    file: File,
    type: 'logo' | 'favicon' | 'avatar' | 'flowicon'
  ): Observable<DirectUploadPulicAssetRes> {
    const fileFractionByDot = file.name.split('.');
    const fileExt = fileFractionByDot[fileFractionByDot.length - 1];

    let filename = `${type}.${fileExt}`;
    if (type === 'flowicon') {
      filename = `${type}-${fileFractionByDot[0]}.${fileExt.toLowerCase()}`;
    }

    return this.http
      .put<DirectUploadPulicAssetRes>(`file/private/v3/assets/${filename}`, file, {
        headers: { 'x-file-size': String(file.size) },
        observe: 'events',
        reportProgress: true
      })
      .pipe(
        map(event => {
          switch (event.type) {
            case HttpEventType.Sent:
              return <DirectUploadPulicAssetRes>{ status: 'started', percentage: 0 };
            case HttpEventType.UploadProgress:
              return <DirectUploadPulicAssetRes>{
                status: 'processing',
                percentage: Math.round((100 * event.loaded) / event.total)
              };
            case HttpEventType.ResponseHeader:
            case HttpEventType.DownloadProgress:
              return <DirectUploadPulicAssetRes>{ status: 'preparing', percentage: 100 };
            case HttpEventType.Response:
              if (event.body.publicUrl) {
                event.body.publicUrl += '?random=' + new Date().getTime();
              }
              return <DirectUploadPulicAssetRes>{ status: 'completed', percentage: 100, ...event.body };
            default:
              return <DirectUploadPulicAssetRes>{ status: 'completed', percentage: 100 };
          }
        })
      );
  }
}
