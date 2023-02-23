import { Injectable } from '@angular/core';
import { X } from '@b3networks/shared/common';
import { BehaviorSubject } from 'rxjs';

export enum IframeState {
  active = 'active',
  inactive = 'inactive'
}

@Injectable({ providedIn: 'root' })
export class ActiveIframeService {
  private _isMyIframe$ = new BehaviorSubject<boolean>(true);

  isMyIframe = true;

  get isMyIframe$() {
    return this._isMyIframe$.asObservable();
  }

  constructor() {}

  initListenEvent(appId: string) {
    X.activeApplicationEventListener(data => {
      console.log('appId: ', data?.appId);
      this.isMyIframe = data?.appId === appId;
      this._isMyIframe$.next(data?.appId === appId);
    });
  }
}
