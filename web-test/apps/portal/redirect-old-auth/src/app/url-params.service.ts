import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UrlParamsService {
  urlParams = {};

  constructor() {}

  init() {
    let match;
    const pl = /\+/g, // Regex for replacing addition symbol with a space
      search = /([^&=]+)=?([^&]*)/g,
      decode = function (s) {
        return decodeURIComponent(s.replace(pl, ' '));
      },
      query = this.getQueryString();

    this.urlParams = {};
    while ((match = search.exec(query))) {
      //Convert c-style parameter names to camel case, i.e. app_id = appId
      const camelCased = decode(match[1]).replace(/_([a-z])/g, function (g) {
        return g[1].toUpperCase();
      });
      this.urlParams[camelCased] = decode(match[2]);
    }

    //Maintain backwards compatibility with our existing invitation and verification code
    if (this.urlParams['id']) {
      this.urlParams['orgId'] = this.urlParams['id'];
    }
  }

  hasParam(): boolean {
    return !this.isEmpty(this.urlParams);
  }

  getEncodedParams() {
    const result = {};
    for (const key in this.urlParams) {
      if (this.urlParams.hasOwnProperty(key)) {
        result[key] = encodeURIComponent(this.urlParams[key]);
      }
    }
    return result;
  }

  getRedirectUrl(): string {
    return this.urlParams['redirectUrl'] || this.urlParams['redirectUri'];
  }

  private getQueryString(): string {
    return window.location.search.substring(1);
  }

  private isEmpty(data) {
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }
}
