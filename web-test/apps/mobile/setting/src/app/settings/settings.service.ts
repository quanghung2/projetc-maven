import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  isWindows$ = new BehaviorSubject<boolean>(false);

  constructor() {}
}
