import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category, FilesResponse, OrganizationResponse, PresignDocumentResponse } from './documents.model';

export interface SendCodeResponse {
  email: string;
}

export interface VerifyCodeResponse {
  accessToken: string;
}

export class AckRequestBody {
  orgUuid: string;
  categoryId: number;
  fileKey: string;

  constructor(obj?) {
    Object.assign(this, obj);
  }
}

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  constructor(private http: HttpClient) {}

  presign(key: string, orgUuid: string) {
    return this.http
      .post(`file/private/v1/documents/upload/presign`, {
        orgUuid: orgUuid,
        key: key
      })
      .pipe(map(res => new PresignDocumentResponse(res)));
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<Category[]>(`file/private/v1/documents/categories`)
      .pipe(map((resp: Category[]) => resp.map(category => new Category(category))));
  }

  ack(requestAck: AckRequestBody) {
    return this.http.post(`file/private/v1/documents/upload/ack`, requestAck).pipe(map(res => new AckRequestBody(res)));
  }

  sendCode(orgUuid: string): Observable<SendCodeResponse> {
    const body = {
      orgUuid: orgUuid
    };
    return this.http.post<SendCodeResponse>(`file/private/v1/documents/auth`, body);
  }

  verifyCode(code: string, orgUuid: string): Observable<VerifyCodeResponse> {
    const params = {
      code: code,
      orgUuid: orgUuid
    };
    return this.http.get<VerifyCodeResponse>(`file/private/v1/documents/auth`, { params: params });
  }

  getFileList(accessToken: string, orgUuid: string): Observable<FilesResponse[]> {
    const params = {
      accessToken: accessToken,
      orgUuid: orgUuid
    };
    return this.http
      .get<FilesResponse[]>(`file/private/v1/documents/x`, { params: params })
      .pipe(map(res => res.map(file => new FilesResponse(file))));
  }

  downloadFile(file: FilesResponse, accessToken, orgUuid) {
    const params = {
      accessToken: accessToken,
      orgUuid: orgUuid
    };
    return this.http.get(`file/private/v1/documents/x/${file.id}`, { params: params });
  }

  getOrganizationByUuid(orgUuid: string): Observable<OrganizationResponse> {
    return this.http.get<OrganizationResponse>(`file/private/v1/documents/organizations/${orgUuid}`);
  }
}
