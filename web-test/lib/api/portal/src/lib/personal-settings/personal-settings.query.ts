import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { map } from 'rxjs/operators';
import { PersonalSettings } from './personal-settings.model';
import { PersonalSettingStore } from './personal-settings.store';

@Injectable({ providedIn: 'root' })
export class PersonalSettingsQuery extends Query<PersonalSettings> {
  darkMode$ = this.select('darkMode');
  appSettings$ = this.select('apps');

  constructor(protected override store: PersonalSettingStore) {
    super(store);
  }

  selectAppSettings(orgUuid: string, appId: string) {
    return this.select('apps').pipe(map(apps => apps.find(app => app.appId === appId && app.orgUuid === orgUuid)));
  }

  getAppSettings(orgUuid: string, appId: string) {
    return this.getValue()?.apps?.find(app => app.appId === appId && app.orgUuid === orgUuid);
  }
}
