import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppState } from './app-state.model';
import { AppStore } from './app.store';

@Injectable({ providedIn: 'root' })
export class AppService {
  constructor(private appStore: AppStore, private http: HttpClient) {}

  update(app: Partial<AppState>) {
    this.appStore.update(state => {
      return { ...state, ...app };
    });
  }
}
