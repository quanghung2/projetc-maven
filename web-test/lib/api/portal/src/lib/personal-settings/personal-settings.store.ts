import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { PersonalSettings } from './personal-settings.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'portal_personal_settings' })
export class PersonalSettingStore extends Store<PersonalSettings> {
  constructor() {
    super({ apps: [] });
  }
}
