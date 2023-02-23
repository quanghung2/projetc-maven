import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CacheService {
  cache: any = {};

  constructor() {}

  put(key: string, data: any) {
    this.cache[key] = data;
  }

  get(key: string) {
    return this.cache[key];
  }

  containKey(key: string) {
    return this.cache[key];
  }
}
