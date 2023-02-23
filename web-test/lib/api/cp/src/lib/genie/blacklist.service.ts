import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BlacklistService {
  constructor(private http: HttpClient) {}

  deleteBlacklist(blacklist: string[]) {
    const params = new HttpParams().append('d', blacklist.join(','));
    return this.http.delete(`/notification/cp/v1/emails/blacklist`, { params: params });
  }
}
