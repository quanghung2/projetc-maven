import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DefaultTagService {
  constructor(private httpClient: HttpClient) {}

  createTag(req: any) {
    return this.httpClient.put(`billing/private/v6/buyerTagTemplate`, req);
  }

  getDefaultTag() {
    return this.httpClient.get<{ defaultKeys: string[] }>(`billing/private/v6/buyerTagTemplate`);
  }
}
