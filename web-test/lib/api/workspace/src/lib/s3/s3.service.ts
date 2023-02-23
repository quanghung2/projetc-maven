import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { randomGuid } from '@b3networks/shared/common';
import { BehaviorSubject, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { EmailMessageGeneral } from '../email/email-integration.model';
import { MediaService } from '../media/media.service';
import { FileResp, MediaConversationType } from './s3.model';

/**
 * @deprecated user S3Service of api-file instead
 *
 */
@Injectable({
  providedIn: 'root'
})
export class S3Service {
  static URL_MEDIA_PUBLIC = 'workspace/public/v1/media';

  private s3Info = new S3Info();

  constructor(private http: HttpClient) {}

  upload(
    orgUuid: string,
    file: File,
    convoGroupUuid: string,
    convoType: MediaConversationType,
    isPublic = false
  ): Uploader {
    if (file.size <= MAX_FILE_SIZE) {
      const fileName = file.name.replace(/ /g, '_').replace(/[\[\](),]+/g, '');
      const s3Key = `${orgUuid}/${randomGuid()}/` + fileName;

      const uploader = new Uploader(new FileResp(s3Key, `${this.s3Info.endpoint}/${s3Key}`));
      let post$;
      if (isPublic) {
        post$ = this.getPresignDataPublic(<RequestPresignData>{
          key: fileName,
          convoUuid: convoGroupUuid,
          convoType: convoType,
          orgUuid: orgUuid
        });
      } else {
        post$ = this.getPresignData(<RequestPresignData>{
          key: fileName,
          convoUuid: convoGroupUuid,
          convoType: convoType
        });
      }

      post$.subscribe(
        res => {
          uploader.upload(res['url'], file);
          uploader.fileResp.mediaUuid = res['uuid'];
        },
        err => {
          uploader.error(err['_body']['currentTarget']);
        }
      );

      return uploader;
    } else {
      console.error(`Your proposed upload exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return null;
    }
  }

  createAttachment(conversationUuid: string, fileKey: string) {
    const url = '/workspace/private/v1/attachments';
    const body = {
      conversationUuid: conversationUuid,
      fileKey: fileKey
    };
    return this.http.post(url, body);
  }

  putMediaUuid(mediaUuid: string) {
    return this.http.put(`/workspace/private/v1/media/${mediaUuid}`, {});
  }

  private getPresignData(req: RequestPresignData) {
    return this.http.post(`/workspace/private/v1/media`, req);
  }

  // ============== PUBLIC ================
  // if use this func, headers must to have properties
  // none session token
  // headers = headers.append('x-user-org-uuid', orgUuid);
  // headers = headers.append('x-user-domain', location.hostname);

  putMediaUuidPublic(mediaUuid: string) {
    return this.http.put(`${MediaService.URL_MEDIA_THUMBNAIL_PUBLIC}/${mediaUuid}`, {});
  }

  private getPresignDataPublic(req: RequestPresignData) {
    return this.http.post(S3Service.URL_MEDIA_PUBLIC, req);
  }

  uploadObjectToS3(obj: EmailMessageGeneral, s3Key: string) {
    const blob: any = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    if (blob.size <= MAX_FILE_SIZE) {
      const publisher = new BehaviorSubject<UploadEvent>(new UploadEvent(UploadStatus.started, 0));
      const xhr: XMLHttpRequest = new XMLHttpRequest();
      const uploader = new Uploader(new FileResp(s3Key, `${this.s3Info.endpoint}/${s3Key}`));
      return this.createScheduleEmailData(s3Key).pipe(
        delay(500),
        tap((res: any) => uploader.upload(res['url'], blob, res.header))
      );
    } else {
      return throwError(() => ({ message: `Your proposed upload exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB` }));
    }
  }

  private createScheduleEmailData(key: string) {
    const data = {
      appId: 'ksBPkp8Y6xzbydjS',
      bucket: 'workspace-attachments',
      key: key,
      maxFileSize: MAX_FILE_SIZE,
      acl: 'Private'
    };

    return this.http.post('portal/private/v1/s3', data);
  }
}

class RequestPresignData {
  key: string;
  convoUuid: string;
  convoType: MediaConversationType;
  orgUuid: string; // for public
}

class S3Info {
  bucket = 'workspace-attachments';
  endpoint = `https://${this.bucket}.s3.amazonaws.com`;

  constructor() {}
}

export enum UploadStatus {
  started = <any>'started',
  processing = <any>'processing',
  completed = <any>'completed',
  canceled = <any>'canceled'
}

export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 2GB
const INITIAL_PERCENTAGE = 10;

export class UploadEvent {
  percentage: number;
  status: UploadStatus;

  constructor(status?: UploadStatus, percentage?: number) {
    this.status = status || UploadStatus.started;
    this.percentage = percentage || 0;
  }

  get uploading() {
    return this.status === UploadStatus.processing;
  }

  get completed() {
    return this.status === UploadStatus.completed;
  }
}

/**
 * @deprecated user S3Service of api-file instead
 *
 */
export class Uploader {
  xhr: XMLHttpRequest = new XMLHttpRequest();
  publisher: BehaviorSubject<UploadEvent> = new BehaviorSubject<UploadEvent>(new UploadEvent(UploadStatus.started, 0));
  status = '';
  fileResp: FileResp;

  constructor(fileResp: FileResp) {
    this.fileResp = fileResp;

    this.xhr.onreadystatechange = () => {
      if (this.xhr.readyState === 4) {
        if (this.xhr.status === 200) {
          this.status = 'completed';
          this.publisher.next(new UploadEvent(UploadStatus.completed, 100));
          this.publisher.complete();
        } else if (this.status !== 'canceled') {
          this.status = 'error';
          this.publisher.error(this.xhr);
        }
      }
    };

    this.xhr.upload.addEventListener(
      'progress',
      event => {
        if (this.status === 'sending') {
          const percentage = Math.round((event['loaded'] * 90) / event['total']);
          this.publisher.next(new UploadEvent(UploadStatus.processing, INITIAL_PERCENTAGE + percentage));
        }
      },
      false
    );
  }

  upload(url: string, file, header?) {
    this.status = 'sending';
    this.publisher.next(new UploadEvent(UploadStatus.processing, INITIAL_PERCENTAGE));
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

  cancel() {
    if (this.status !== 'completed' && this.status !== 'error') {
      if (this.status === 'sending') {
        this.status = 'canceled';
        this.xhr.abort();
      }
      this.publisher.next(new UploadEvent(UploadStatus.canceled, 0));
      this.publisher.complete();
    }
  }

  error(err) {
    this.status = 'error';
    this.publisher.error(err);
  }

  subscribe(observerOrNext?: any | ((value) => void), error?: (error: any) => void, complete?: () => void) {
    this.publisher.subscribe(observerOrNext, error, complete);
    return this;
  }
}
