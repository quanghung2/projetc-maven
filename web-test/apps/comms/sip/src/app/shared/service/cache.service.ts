import { Injectable } from '@angular/core';

@Injectable()
export class CacheService {
  cache: any = {};

  constructor() {}

  put(key: string, data: any) {
    this.cache[key] = data;
  }

  get(key: string) {
    return this.cache[key];
  }
}
