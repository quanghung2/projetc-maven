import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CacheMedia, CacheMediaQuery, CacheMediaService } from '@b3networks/api/common';
import { UUID_V4_REGEX, X_B3_HEADER } from '@b3networks/shared/common';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  DownloadFileV3Req,
  FileInfo,
  FileInfoResponse,
  FileResponExplorer,
  Folder,
  JobDetailModel,
  JobResponse,
  RequestUploadData,
  StorageFileInfo
} from './file.model';
import { FileStore } from './file.store';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  constructor(
    private http: HttpClient,
    private cacheMediaQuery: CacheMediaQuery,
    private cacheMediaService: CacheMediaService,
    private fileStore: FileStore
  ) {}

  queryFiles(
    prefix: string = '',
    nextToken: string = '',
    size: number = 10,
    first_child?: string,
    domain?: string
  ): Observable<FileInfoResponse> {
    let params: HttpParams = new HttpParams().set('prefix', prefix).set('size', String(size));
    if (nextToken) {
      params = params.set('next_token', escape(nextToken));
    }
    if (first_child) {
      params = params.set('first_child', first_child);
    }
    if (domain) {
      params = params.set('domain', domain);
    }
    return this.http
      .get<FileInfoResponse>(`file/private/v1/files`, { params: params })
      .pipe(map(res => Object.assign(new FileInfoResponse(), res)));
  }

  getDownloadFileUrl(key: string): Observable<{ url: string }> {
    return this.http.get<any>(`file/private/v1/files/url`, { params: { key: key } });
  }

  getFilesV3(dateValue: string, type: string, cursor?: string): Observable<FileResponExplorer> {
    let params = new HttpParams();
    params = cursor ? params.set('cursor', String(cursor)) : params;

    return this.http.get(`file/private/v3/list/${type}/${dateValue}`, { params: params }).pipe(
      map(res => new FileResponExplorer(res)),
      tap(_ => {
        if (type === 'recordings') {
          this.fileStore.updateStateFileExplorer({
            dateRecording: dateValue,
            nextCursorRecording: cursor
          });
        } else {
          this.fileStore.updateStateFileExplorer({
            dateVoicemail: dateValue,
            nextCursorVoicemail: cursor
          });
        }
      })
    );
  }

  getListJobs({ orgUuid, sessionToken }): Observable<JobResponse> {
    let params = new HttpParams();

    if (orgUuid) {
      params = params.set(X_B3_HEADER.sessionToken, sessionToken);
    }
    if (sessionToken) {
      params = params.set(X_B3_HEADER.orgUuid, orgUuid);
    }

    return this.http.get(`file/private/v3/job`, { params: params }).pipe(map(resp => new JobResponse(resp)));
  }

  getJobDetailById(jobId: string | number, { orgUuid, sessionToken }): Observable<JobDetailModel> {
    let params = new HttpParams();

    if (orgUuid) {
      params = params.set(X_B3_HEADER.sessionToken, sessionToken);
    }
    if (sessionToken) {
      params = params.set(X_B3_HEADER.orgUuid, orgUuid);
    }

    return this.http
      .get(`file/private/v3/job/${jobId}`, { params: params })
      .pipe(map(resp => new JobDetailModel(resp)));
  }

  getListTrashBin(prefix: string, cursor: string): Observable<FileResponExplorer> {
    let params = new HttpParams();
    params = cursor ? params.set('cursor', String(cursor)) : params;

    return this.http
      .get(`file/private/v3/listTrash/${prefix}`, { params: params })
      .pipe(map(res => new FileResponExplorer(res)));
  }

  restoreTrashBin(prefixes: string[], { orgUuid, sessionToken }): Observable<any> {
    let params = new HttpParams();

    if (orgUuid) {
      params = params.set(X_B3_HEADER.sessionToken, sessionToken);
    }
    if (sessionToken) {
      params = params.set(X_B3_HEADER.orgUuid, orgUuid);
    }

    return this.http.post(
      `file/private/v3/restoreBulk`,
      { prefixes: prefixes },
      { params: params, observe: 'response', responseType: 'json' }
    );
  }

  shredTrashBin(prefixes: string[], { orgUuid, sessionToken }): Observable<any> {
    let params = new HttpParams();

    if (orgUuid) {
      params = params.set(X_B3_HEADER.sessionToken, sessionToken);
    }
    if (sessionToken) {
      params = params.set(X_B3_HEADER.orgUuid, orgUuid);
    }

    return this.http.post(
      `file/private/v3/trashDeleteBulk`,
      { prefixes: prefixes },
      { params: params, observe: 'response', responseType: 'json' }
    );
  }

  downloadFilesZipV3(files: string[], { orgUuid, sessionToken }): Observable<any> {
    let params = new HttpParams();

    if (orgUuid) {
      params = params.set(X_B3_HEADER.sessionToken, sessionToken);
    }
    if (sessionToken) {
      params = params.set(X_B3_HEADER.orgUuid, orgUuid);
    }

    return this.http.post(
      `file/private/v3/zip`,
      { fileKeys: files },
      { params: params, observe: 'response', responseType: 'blob' }
    );
  }

  deleteFilesV3(files: string[], { orgUuid, sessionToken }): Observable<any> {
    let params = new HttpParams();

    if (orgUuid) {
      params = params.set(X_B3_HEADER.sessionToken, sessionToken);
    }
    if (sessionToken) {
      params = params.set(X_B3_HEADER.orgUuid, orgUuid);
    }

    return this.http.post(
      `file/private/v3/deleteBulk`,
      { prefixes: files, trash: true },
      { params: params, observe: 'response', responseType: 'json' }
    );
  }

  zip2Download(files: FileInfo[], folders: Folder[]) {
    return this.http.post(
      `file/private/v1/files/zip`,
      { files: files, folders: folders },
      { responseType: 'arraybuffer' }
    );
  }

  downloadFile(fileKey: string, addon?: { orgUuid: string }) {
    let headers = new HttpHeaders();
    if (addon && addon.orgUuid) {
      headers = headers.set(X_B3_HEADER.orgUuid, addon.orgUuid);
    }

    return this.http.get(`file/private/v1/media/${fileKey}`, {
      observe: 'response',
      responseType: 'blob',
      headers: headers
    });
  }

  downloadTempFile(tempKey: string) {
    return this.http.get(`file/private/v3/temp/${tempKey}`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  downloadFileV3(fileKey: string, req?: DownloadFileV3Req, headers?: HttpHeaders): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();
    if (req != null && Object.keys(req).length) {
      Object.keys(req).forEach(key => {
        if (req[key]) {
          params = params.set(key, String(req[key]));
        }
      });
    }

    let s3KeyWithouOrgUuid = fileKey;
    const rs: RegExpMatchArray = s3KeyWithouOrgUuid.match(UUID_V4_REGEX);
    if (rs && rs.index === 0) {
      s3KeyWithouOrgUuid = s3KeyWithouOrgUuid.slice(37);
    }

    const url = `file/private/v3/files/${s3KeyWithouOrgUuid}`;
    return this.http.get(url, {
      observe: 'response',
      responseType: 'blob',
      headers,
      params
    });
  }

  downloadFileV3Public(fileKey: string, req: RequestUploadData): Observable<HttpResponse<Blob>> {
    let s3KeyWithouOrgUuid = fileKey;
    const rs: RegExpMatchArray = s3KeyWithouOrgUuid.match(UUID_V4_REGEX);
    if (rs && rs.index === 0) {
      s3KeyWithouOrgUuid = s3KeyWithouOrgUuid.slice(37);
    }

    let params = new HttpParams();
    Object.keys(req).forEach(key => {
      if (req[key]) {
        params = params.append(key, req[key]);
      }
    });

    const header = new HttpHeaders().append('content-type', 'application/octet-stream');

    return this.http.get(`file/public/v3/files/${s3KeyWithouOrgUuid}`, {
      params: params,
      headers: header,
      observe: 'response',
      responseType: 'blob'
    });
  }

  getFileInfo(fileKey: string, headers?: HttpHeaders) {
    return this.http.get<StorageFileInfo>(`file/private/v3/info/${fileKey}`, { headers });
  }

  getThumbnailMediaStorageUuid(fileKey: string, req: RequestUploadData) {
    if (!fileKey) {
      return of(null);
    }

    let s3KeyWithouOrgUuid = fileKey;
    const rs: RegExpMatchArray = s3KeyWithouOrgUuid.match(UUID_V4_REGEX);
    if (rs && rs.index === 0) {
      s3KeyWithouOrgUuid = s3KeyWithouOrgUuid.slice(37);
    }

    const found = this.cacheMediaQuery.getMediaByKey(s3KeyWithouOrgUuid, false);
    if (found) {
      return of(found.url);
    } else {
      let params = new HttpParams();
      Object.keys(req).forEach(key => {
        if (req[key]) {
          params = params.append(key, req[key]);
        }
      });

      const header = new HttpHeaders().append('content-type', 'application/octet-stream');

      return this.http
        .get(`file/public/v3/thumbnail/${s3KeyWithouOrgUuid}`, {
          params: params,
          headers: header,
          observe: 'response',
          responseType: 'blob'
        })
        .pipe(
          map(resp => {
            const file = new Blob([resp.body], { type: `${resp.body.type}` });
            return URL.createObjectURL(file);
          }),
          tap(url => {
            this.cacheMediaService.add(
              new CacheMedia({
                key: s3KeyWithouOrgUuid,
                url: url
              })
            );
          })
        );
    }
  }
}
