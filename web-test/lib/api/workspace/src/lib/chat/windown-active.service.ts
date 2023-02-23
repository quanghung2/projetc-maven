import { Injectable } from '@angular/core';
import { isLocalhost } from '@b3networks/shared/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WindownActiveService {
  private _windowActiveStatus$ = new BehaviorSubject<boolean>(true);

  windowActiveStatus = true;
  get windowActiveStatus$() {
    return this._windowActiveStatus$.asObservable();
  }

  constructor() {
    try {
      if (!isLocalhost()) {
        this._listenVisibleTab();
      }
    } catch (error) {
      console.log('🚀 ~ error', error);
    }
  }

  private _listenVisibleTab() {
    let stateKey, eventKey;
    const keys = {
      hidden: 'visibilitychange',
      webkitHidden: 'webkitvisibilitychange',
      mozHidden: 'mozvisibilitychange',
      msHidden: 'msvisibilitychange'
    };
    for (stateKey in keys) {
      if (stateKey in window.parent.document) {
        eventKey = keys[stateKey];
        break;
      }
    }

    if (stateKey) {
      this.windowActiveStatus = !document[stateKey];
      this._windowActiveStatus$.next(!document[stateKey]);
    }

    if (eventKey) {
      window.parent.document.addEventListener(eventKey, () => {
        this.windowActiveStatus = !document[stateKey];
        this._windowActiveStatus$.next(!document[stateKey]);
      });
    }
  }
}
