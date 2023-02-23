import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileDownloadResponse {
  downloadUrl: string;
  fileName: string;
  fileSize: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileDownloadService {
  constructor(private http: HttpClient) {}

  getDownloadFileUrl(fileKey: string) {
    return this.http.get(`file/private/v1/media/${fileKey}`, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
