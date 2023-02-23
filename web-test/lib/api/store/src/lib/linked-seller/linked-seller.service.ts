import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LinkedSeller } from './linked-seller';

@Injectable({
  providedIn: 'root'
})
export class LinkedSellerService {
  constructor(private http: HttpClient) {}

  get() {
    return this.http.get<LinkedSeller[]>(`/store/private/v2/linked-sellers`);
  }
}
