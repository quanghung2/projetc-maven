import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export const Status = {
  STARTED: 'started',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
  NONE: undefined
};

const ACTION_SUCCESS_STATUS = 200;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const INITIAL_PERCENTAGE = 10;

export class UploadEvent {
  constructor(public status: string, public percentage: number) {}
}

class S3Info {
  bucket = '';
  folder = '';
  endpoint: string;
  url: string;

  constructor(bucket?: string, baseFolder?: string, url?: string) {
    bucket = bucket === undefined ? '' : bucket;
    if (bucket.indexOf('/') >= 0) {
      const bucketInfo = bucket.split('/');
      bucket = bucketInfo[0];
      if (bucketInfo.length > 1) {
        this.folder = bucketInfo[1];
      }
    }
    this.bucket = bucket;
    this.endpoint = 'https://' + bucket + '.s3.amazonaws.com';
    this.url = url;
  }
}

/**
 * @deprecated user S3Service of api-file instead
 *
 */
export class Uploader {
  constructor(
    public publisher: BehaviorSubject<UploadEvent>,
    public xhr: XMLHttpRequest,
    public fileName: string,
    public fileUrl,
    public bucket = '',
    public status = 'initialized'
  ) {
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === ACTION_SUCCESS_STATUS) {
          this.status = 'completed';
          publisher.next(new UploadEvent(Status.COMPLETED, 100));
          publisher.complete();
        } else if (this.status !== 'canceled') {
          this.status = 'error';
          publisher.error(xhr);
        }
      }
    };
    xhr.upload.addEventListener(
      'progress',
      event => {
        if (this.status === 'sending') {
          const percentage = Math.round((event['loaded'] * 90) / event['total']);
          publisher.next(new UploadEvent(Status.PROCESSING, INITIAL_PERCENTAGE + percentage));
        }
      },
      false
    );
  }

  subscribe(observerOrNext?: any | ((value) => void), error?: (error: any) => void, complete?: () => void) {
    this.publisher.subscribe(observerOrNext, error, complete);
    return this;
  }

  cancel() {
    if (this.status !== 'completed' && this.status !== 'error') {
      if (this.status === 'sending') {
        this.status = 'canceled';
        this.xhr.abort();
      }
      this.publisher.next(new UploadEvent(Status.CANCELED, 0));
      this.publisher.complete();
    }
  }

  error(err) {
    this.status = 'error';
    this.publisher.error(err);
  }

  upload(url: string, file) {
    this.status = 'sending';
    this.publisher.next(new UploadEvent(Status.PROCESSING, INITIAL_PERCENTAGE));
    this.xhr.open('PUT', url, true);

    if (file.type) {
      this.xhr.setRequestHeader('content-type', file.type);
      this.xhr.setRequestHeader('x-file-size', String(file.size));
    }

    this.xhr.send(file);
  }
}

/**
 * @deprecated user S3Service of api-file instead
 *
 */
@Injectable()
export class S3Service {
  s3Info = new S3Info(environment.settings.s3Bucket, environment.settings.s3Folder, environment.settings.signUrl);

  constructor(private http: HttpClient) {}

  upload(file: File, key: string, isPreSignUrl = false): Uploader {
    let url = '';
    if (isPreSignUrl) {
      url = environment.settings.apiUrl + '/file/private/v1/files/presign';
    } else {
      url = environment.settings.apiUrl + '/portal/private/v1/s3';
    }
    this.s3Info = new S3Info(environment.settings.s3Bucket, environment.settings.s3Folder, url);

    if (this.s3Info.folder !== '') {
      key = this.s3Info.folder + '/' + key;
    }
    const publisher = new BehaviorSubject<UploadEvent>(new UploadEvent(Status.STARTED, 0));
    const xhr: XMLHttpRequest = new XMLHttpRequest();
    const uploader = new Uploader(publisher, xhr, file.name, this.s3Info.endpoint + '/' + key);
    this.getSignedPolicy(key).subscribe(
      res => {
        uploader.upload(res.url, file);
        if (isPreSignUrl) {
          (uploader.bucket = res.bucket), (uploader.fileUrl = res.key);
        }
      },
      err => {
        uploader.error(err['_body']['currentTarget']);
      }
    );
    return uploader;
  }

  private getSignedPolicy(key: string) {
    return this.http.post<any>(this.s3Info.url, {
      appId: environment.settings.appId,
      bucket: environment.settings.s3Bucket,
      key: key,
      maxFileSize: MAX_FILE_SIZE
    });
  }
}
