import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NetworkService {
  private _status$ = new Subject<boolean>();

  isOnline = true;

  get status$() {
    return this._status$.asObservable();
  }

  constructor() {
    // register listener network
    window.addEventListener('online', () => {
      console.log('online');
      this.isOnline = true;
      this._status$.next(true);
    });

    window.addEventListener('offline', () => {
      console.log('offline');
      this.isOnline = false;
      this._status$.next(false);
    });
  }
}
