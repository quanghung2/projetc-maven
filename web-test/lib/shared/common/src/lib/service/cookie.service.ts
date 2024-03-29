import { Injectable } from '@angular/core';
import { REPLACE_BY_SUBDOMAINS, SUBDOMAIN } from '../constants/constants';
import { isLocalhost } from '../utils/plain_func.util';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  /**
   * Checks the existence of a single cookie by it's name
   *
   * @param  {string} name Identification of the cookie
   * @returns existence of the cookie
   */
  check(name: string): boolean {
    if (typeof document === 'undefined') return false; // Check if document exist avoiding issues on server side prerendering
    name = encodeURIComponent(name);
    const regexp = new RegExp('(?:^' + name + '|;\\s*' + name + ')=(.*?)(?:;|$)', 'g');
    const exists = regexp.test(document.cookie);
    return exists;
  }

  /**
   * Retrieves a single cookie by it's name
   *
   * @param  {string} name Identification of the Cookie
   * @returns The Cookie's value
   */
  get(name: string): string {
    if (this.check(name)) {
      name = encodeURIComponent(name);
      const regexp = new RegExp('(?:^' + name + '|;\\s*' + name + ')=(.*?)(?:;|$)', 'g');
      const result = regexp.exec(document.cookie);
      return decodeURIComponent(result[1]);
    } else {
      return '';
    }
  }

  getObj(name: string) {
    const value = this.get(name);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Retrieves a a list of all cookie avaiable
   *
   * @returns Object with all Cookies
   */
  getAll(): any {
    const cookies: any = {};

    // tslint:disable-next-line:triple-equals
    if (document.cookie && document.cookie != '') {
      const split = document.cookie.split(';');
      for (const s of split) {
        const currCookie = s.split('=');
        currCookie[0] = currCookie[0].replace(/^ /, '');
        cookies[decodeURIComponent(currCookie[0])] = decodeURIComponent(currCookie[1]);
      }
    }

    return cookies;
  }

  /**
   * Save the Cookie
   *
   * @param  {string} name Cookie's identification
   * @param  {string} value Cookie's value
   * @param  {number} expires Cookie's expiration date in days from now or at a specific date from a Date object. If it's undefined the cookie is a session Cookie
   * @param  {string} path Path relative to the domain where the cookie should be avaiable. Default /
   * @param  {string} domain Domain where the cookie should be avaiable. Default current domain
   * @param  {boolean} secure If true, the cookie will only be available through a secured connection
   */
  set(name: string, value: string, expires?: number | Date, path?: string, domain?: string, secure?: boolean) {
    let cookieStr = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';';

    if (expires) {
      if (typeof expires === 'number') {
        const dtExpires = new Date(new Date().getTime() + expires * 1000 * 60 * 60 * 24);
        cookieStr += 'expires=' + dtExpires.toUTCString() + ';';
      } else {
        cookieStr += 'expires=' + expires.toUTCString() + ';';
      }
    }

    if (!path) {
      path = '/';
    }
    cookieStr += 'path=' + path + ';';
    if (!isLocalhost() && !!domain) {
      if (REPLACE_BY_SUBDOMAINS.indexOf(btoa(domain)) > -1) {
        domain = atob(SUBDOMAIN);
      }
      cookieStr += 'domain=' + domain + ';';
    }
    if (secure) {
      cookieStr += 'secure;samesite=Lax';
    }

    console.log(`Set cookie string ${cookieStr}`);

    document.cookie = cookieStr;
  }

  /**
   * Removes specified Cookie
   *
   * @param  {string} name Cookie's identification
   * @param  {string} path Path relative to the domain where the cookie should be avaiable. Default /
   * @param  {string} domain Domain where the cookie should be avaiable. Default current domain
   */
  delete(name: string, path?: string, domain?: string): void {
    this.set(name, '', -1, path, domain);
  }

  /**
   * Delete all cookie avaiable
   */
  deleteAll(path?: string, domain?: string, ignoreCookie?: string): void {
    const cookies = this.getAll();

    for (const cookieName of Object.keys(cookies)) {
      if (cookieName !== ignoreCookie) {
        this.delete(cookieName, path, domain);
      }
    }
  }
}
