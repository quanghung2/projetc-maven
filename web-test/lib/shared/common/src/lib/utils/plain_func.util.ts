import { HttpHeaders } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router } from '@angular/router';
import { HashMap } from '@datorama/akita';
import { DeltaStatic } from 'quill';
import { DISTRIBUTION_DOMAINS } from '../constants/constants';

// @internal
export function toBoolean(value: any): boolean {
  return value != null && `${value}` !== 'false';
}

// @internal
export function isPlainObject(value: { constructor: { name: string } }) {
  return toBoolean(value) && value.constructor.name === 'Object';
}

export function isDistributionDomain() {
  return DISTRIBUTION_DOMAINS.indexOf(location.hostname) > -1;
}

export function isDistributionOrAdminPortal(): boolean {
  return isAdminPortal() || isDistributionDomain();
}

export function isAdminPortal(): boolean {
  return location.pathname === '/admin/';
}

export function randomGuid(): string {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

export function randomRGBA(uuid: string) {
  const hash = getHashCode(uuid);
  const r = (hash & 0xff0000) >> 16;
  const g = (hash & 0x00ff00) >> 8;
  const b = hash & 0x0000ff;
  return `rgba(${r}, ${g}, ${b}, 0.5)`;
}

export function randomHex() {
  return '#' + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6);
}

export function humanFileSize(size: number) {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  const number = size / Math.pow(1024, i);
  return number.toFixed(2) + ' ' + ['B', 'KB', 'MB', 'GB', 'TB'][i];
}

export function getFileExtension(filename: string) {
  const ext = /^.+\.([^.]+)$/.exec(filename);
  return ext == null ? '' : ext[1];
}

export function parseUnicode(string: string) {
  return string.split('-').map((str: string) => parseInt(str, 16));
}

function getHashCode(str: string) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i); /* hash * 33 + c */
  }
  return hash;
}

export function setBit(x: number, pos: number): number {
  return x | (1 << pos);
}

export function getBit(x: number, pos: number): boolean {
  return (x & (1 << pos)) >> pos === 1;
}

export function deltaHasContent(delta: DeltaStatic): boolean {
  return (
    delta != null &&
    delta.ops.some(function (ops): boolean {
      if (typeof ops.insert === 'string') {
        return !!ops.insert?.trim();
      } else if (typeof ops.insert === 'object') {
        return true;
      }
      return false;
    })
  );
}

export function isLocalhost() {
  return ['localhost', '127.0.0.1'].indexOf(window.location.hostname) > -1;
}

export function buildUrlParameter(): HashMap<any> {
  let match;
  const pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s: string) {
      return decodeURIComponent(s.replace(pl, ' '));
    };

  let query = window.location.search.substring(1);
  if (!query) {
    query = window.location.hash.split('?')[1];
  }
  const result: { [key: string]: any } = {};
  if (query) {
    while ((match = search.exec(query))) {
      const paramName = decode(match[1]);
      const paramValue = decode(match[2]);
      if (paramName.indexOf('-') >= 0) {
        const parts = paramName.split('-');
        const appName = parts[0];
        const appParamName = parts[1];
        result[appName] = {};
        result[appParamName] = paramValue;
      } else {
        result[paramName] = paramValue;
      }
    }
  }

  return result;
}

export function generateUUID(): string {
  let d = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

export function generateRandomString(length: number) {
  let s = '';
  const randomchar = function () {
    const n = Math.floor(Math.random() * 62);
    if (n < 10) return n; //1-10
    if (n < 36) return String.fromCharCode(n + 55); //A-Z
    return String.fromCharCode(n + 61); //a-z
  };
  while (s.length < length) s += randomchar();
  return s;
}

export function detectMobile() {
  const toMatch = [/Android/i, /webOS/i, /iPhone/i, /iPad/i, /iPod/i, /BlackBerry/i, /Windows Phone/i];

  return toMatch.some(toMatchItem => {
    return navigator.userAgent.match(toMatchItem);
  });
}

export function download(url: string, filename: string) {
  let blob = null;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.onload = function () {
    blob = xhr.response;
    downloadData(blob, filename);
  };
  xhr.send();
}

export function getFilenameFromHeader(headers: HttpHeaders): string {
  const contentDisposition = headers.get('content-disposition') || '';
  const matches = /filename=([^;]+)/gi.exec(contentDisposition);
  return (matches && matches[1] ? matches[1] : '').trim();
}

export async function downloadData(data: Blob, filename: string) {
  const url = URL.createObjectURL(data);
  donwloadFromUrl(url, filename, () => {
    URL.revokeObjectURL(url);
  });
}

export function donwloadFromUrl(url: string, filename: string, done?: () => void) {
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename;
  downloadLink.target = '_blank';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  done();
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Remove all non-ascii characters
 * @param key string
 */
export function normalize(key: string) {
  // eslint-disable-next-line no-control-regex
  return key?.replace(/[^\x00-\x7F]/g, '')?.toLowerCase();
}

export function contains(parent: string, child: string) {
  return normalize(parent).includes(normalize(child));
}

export function arrayCompare(_arr1: any[], _arr2: any[]) {
  if (!Array.isArray(_arr1) || !Array.isArray(_arr2) || _arr1.length !== _arr2.length) {
    return false;
  }

  // .concat() to not mutate arguments
  const arr1 = _arr1.concat().sort();
  const arr2 = _arr2.concat().sort();

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

export function arraySome(_arr1: any[], _arr2: any[]) {
  // .concat() to not mutate arguments
  const arr1 = _arr1.concat().sort();
  const arr2 = _arr2.concat().sort();

  for (let i = 0; i < arr1.length; i++) {
    const index = arr2.indexOf(arr1[i]);
    if (index > -1) {
      return true;
    }
  }

  return false;
}

export function getCountryTimeZoneLocal() {
  return Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone;
}

export function renderLinkForCopy(router: Router) {
  const path = router.url?.split('?')[0];
  const href = !isLocalhost() ? window.parent.location.href.split('?')[0] : window.location.href.split('?')[0];

  return href + `?path=${encodeURIComponent(path)}`;
}

export function getDeviceSystem() {
  try {
    const userAgent = navigator.userAgent || navigator.vendor || (<any>window)['opera'];

    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
      return 'Windows Phone';
    }

    if (/android/i.test(userAgent)) {
      return 'Android';
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !(<any>window)['MSStream']) {
      return 'iOS';
    }

    if (/Linux/i.test(userAgent)) {
      return 'Linux';
    } else if (/Windows/i.test(userAgent)) {
      return 'Windows';
    } else if (/Mac/i.test(userAgent)) {
      return 'MacOS';
    }

    return null;
  } catch (_) {
    return null;
  }
}

// https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
export function detectBrowser() {
  try {
    if ((navigator.userAgent.indexOf('Opera') || navigator.userAgent.indexOf('OPR')) !== -1) {
      return 'Opera';
    } else if (navigator.userAgent.indexOf('Chrome') !== -1) {
      return 'Chrome';
    } else if (navigator.userAgent.indexOf('Safari') !== -1) {
      return 'Safari';
    } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
      return 'Firefox';
    } else if (navigator.userAgent.indexOf('MSIE') !== -1 || !!(<any>document)['documentMode'] === true) {
      //IF IE > 10
      return 'IE';
    }
    return null;
  } catch (_) {
    return null;
  }
}

export function simpleStringify(object: { [key: string]: any }) {
  const simpleObject: { [key: string]: string | number } = {};

  for (const prop in object) {
    // eslint-disable-next-line no-prototype-builtins
    if (!object.hasOwnProperty(prop)) {
      continue;
    }

    if (typeof object[prop] == 'object') {
      continue;
    }

    if (typeof object[prop] == 'function') {
      continue;
    }

    simpleObject[prop] = object[prop];
  }

  return JSON.stringify(simpleObject);
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

export interface MSG {
  action: 'logout' | 'switchOrg' | 'loaded' | 'close';
  status: 'success' | 'fail';
  fromOrg?: string;
  toOrg?: string;
}

export interface Platforms {
  webkit?: any;
  CrossPlatformMobile?: any;
  Android?: any;
  isWindows?: boolean;
}

export function postMsgToFlutter(msg: MSG, platforms: Platforms) {
  const { webkit, CrossPlatformMobile, Android, isWindows } = platforms;

  // for IOS
  try {
    if (typeof webkit !== 'undefined' && webkit !== null) {
      webkit.messageHandlers.callbackHandler.postMessage(msg);
    }
  } catch (err) {}

  try {
    if (typeof CrossPlatformMobile !== 'undefined' && CrossPlatformMobile !== null) {
      CrossPlatformMobile.postMessage(JSON.stringify(msg));
    }
  } catch (err) {}

  // for android
  try {
    if (typeof Android !== 'undefined' && Android !== null) {
      Android.closeWebView(msg);
    }
  } catch (err) {}

  // for windows
  try {
    if (isWindows) {
      (window as any).parent.chrome.webview.postMessage(JSON.stringify(msg));
    }
  } catch (err) {}
}

export function isExternalUrl(url: string): boolean {
  return /^http(?:s)?:\/{2}\S+$/.test(url);
}

export function isFileImage(file: File) {
  return file && file['type'].split('/')[0] === 'image';
}

export function getFileBase64(file: Blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}
