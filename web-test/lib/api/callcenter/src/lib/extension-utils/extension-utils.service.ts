import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface LatestExtKeyInfo {
  biggestExtGroupKey: string;
  biggestExtKey: string;
  biggestKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExtensionUtilsService {
  constructor(private http: HttpClient) {}

  getLatestExtKey() {
    return this.http.get<LatestExtKeyInfo>(`callcenter/private/v3/getBiggestExtKey`);
  }
}
