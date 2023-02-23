import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomQueryEncoder } from './customQueryEncoder';
import { PrivateHttpService } from './private-http.service';

declare const X: any;

const Status = {
  STARTED: 'started',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
  NONE: undefined
};

const ACTION_SUCCESS_STATUS = 200;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const INITIAL_PERCENTAGE = 10;

class UploadEvent {
  constructor(public status: string, public percentage: number) {}
}

class Uploader {
  constructor(
    public publisher: BehaviorSubject<UploadEvent>,
    public xhr: XMLHttpRequest,
    public fileName: string,
    public fileUrl,
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
  upload(url: string, file: any) {
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

@Injectable({ providedIn: 'root' })
export class LegacyS3Service extends PrivateHttpService {
  constructor(private httpClient: HttpClient) {
    super();
  }

  upload(file: File, bucket: string, key: string): Uploader {
    if (file.size <= MAX_FILE_SIZE) {
      const publisher = new BehaviorSubject<UploadEvent>(new UploadEvent(Status.STARTED, 0));
      const xhr: XMLHttpRequest = new XMLHttpRequest();
      const uploader = new Uploader(publisher, xhr, file.name, this.getS3Endpoint(bucket) + '/' + key);
      this.getPresignData(environment.appId, bucket, key).subscribe(
        res => {
          uploader.upload(res['url'], file);
        },
        err => {
          uploader.error(err['_body']['currentTarget']);
        }
      );
      return uploader;
    } else {
      X.showWarn('Your proposed upload exceeds 5MB');
      return null;
    }
  }

  download(bucket: string, key: string): Observable<Blob> {
    let params = new HttpParams({ encoder: new CustomQueryEncoder() });
    params = params.append('bucketName', bucket);
    params = params.append('key', key);
    return this.httpClient.get(this.constructFinalEndpoint('customer/private/v1/download'), {
      params: params,
      responseType: 'blob'
    });
  }

  getS3Link(bucket: string, key: string) {
    return this.getS3Endpoint(bucket) + `/${key}`;
  }

  private getPresignData(appId: string, bucket: string, key: string) {
    const data = {
      appId: appId,
      bucket: bucket,
      key: key,
      maxFileSize: MAX_FILE_SIZE
    };
    return this.httpClient.post(this.constructFinalEndpoint('/portal/private/v1/s3'), data);
  }

  private getS3Endpoint(bucket: string) {
    return 'https://' + bucket + '.s3.amazonaws.com';
  }
}
