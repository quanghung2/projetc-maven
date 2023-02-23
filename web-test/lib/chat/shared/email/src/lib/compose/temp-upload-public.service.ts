import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Status, UploadEvent } from '@b3networks/api/file';
import { BehaviorSubject, map, Observable } from 'rxjs';

const ACTION_SUCCESS_STATUS = 200;
const INITIAL_PERCENTAGE = 10;

@Injectable({ providedIn: 'root' })
export class TempUploadPublicService {
  constructor(private httpClient: HttpClient) {}

  /**
   * @deprecated The method should not be used
   */
  uploadPublicAssets(file: File, key: string): Uploader {
    const uploader = new Uploader(
      new BehaviorSubject<UploadEvent>(<UploadEvent>{ status: Status.STARTED, percentage: 0 }),
      new XMLHttpRequest()
    );

    this.presignPublicAssets(key).subscribe(
      (res: any) => {
        uploader.key = res.assets.key;
        uploader.fileUrl = res.assets.public_url;
        uploader.upload(res.assets.upload_url, file, res.header);
      },
      (err: any) => {
        console.error(err);
      }
    );
    return uploader;
  }

  presignPublicAssets(key: string): Observable<PresignPublicResponse> {
    return this.httpClient
      .post<PresignPublicResponse>(`file/private/v2/assetsForSteve/presign`, {
        key: key
      })
      .pipe(map(res => new PresignPublicResponse(res)));
  }
}

export class PresignPublicResponse {
  key: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

/**
 * @deprecated The method should not be used
 */
export enum UploadState {
  initialized,
  progress,
  sending,
  completed,
  canceled,
  error
}

/**
 * @deprecated The method should not be used
 */
export class Uploader {
  constructor(
    public publisher: BehaviorSubject<UploadEvent>,
    public xhr: XMLHttpRequest,
    public key?: string,
    public fileUrl?: string,
    public status: string = UploadState[UploadState.initialized]
  ) {
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === ACTION_SUCCESS_STATUS) {
          this.status = UploadState[UploadState.completed];
          publisher.next(<UploadEvent>{ status: Status.COMPLETED, percentage: 100 });
          publisher.complete();
        } else if (this.status !== UploadState[UploadState.canceled]) {
          this.status = UploadState[UploadState.error];
          publisher.error(xhr);
        }
      }
    };

    xhr.upload.addEventListener(
      UploadState[UploadState.progress],
      event => {
        if (this.status === UploadState[UploadState.sending]) {
          const percentage = Math.round((event['loaded'] * 90) / event['total']);
          publisher.next(<UploadEvent>{ status: Status.PROCESSING, percentage: INITIAL_PERCENTAGE + percentage });
        }
      },
      false
    );
  }

  subscribe(observerOrNext?: any | ((value) => void), error?: (error: any) => void, complete?: () => void) {
    this.publisher.subscribe(observerOrNext, error, complete);
    return this;
  }

  error(err) {
    this.status = UploadState[UploadState.error];
    this.publisher.error(err);
  }

  upload(url: string, file: File | Blob, header: any) {
    this.status = UploadState[UploadState.sending];
    this.publisher.next(<UploadEvent>{ status: Status.PROCESSING, percentage: INITIAL_PERCENTAGE });

    this.xhr.open('PUT', url, true);

    if (file.type) {
      this.xhr.setRequestHeader('content-type', file.type);
      this.xhr.setRequestHeader('x-file-size', String(file.size));
    }

    if (header) {
      Object.keys(header).forEach(key => this.xhr.setRequestHeader(key, header[key]));
    }

    this.xhr.send(file);
  }
}
