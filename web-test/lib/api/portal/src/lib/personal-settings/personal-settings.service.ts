import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { PersonalAppSettings, PersonalSettings } from './personal-settings.model';
import { PersonalSettingStore } from './personal-settings.store';

@Injectable({
  providedIn: 'root'
})
export class PersonalSettingsService {
  constructor(private http: HttpClient, private personalSettingStore: PersonalSettingStore) {}

  getPersonalSettings(): Observable<PersonalSettings> {
    return this.http.get<PersonalSettings>(`/portal/private/v1/settings/personal`).pipe(
      tap(res => {
        this.personalSettingStore.update(res);
      })
    );
  }

  updateDarkMode(isDarkMode: boolean) {
    return this.http
      .get<PersonalSettings>(`/portal/private/v1/settings/personal`)
      .pipe(
        mergeMap(perSettings => {
          perSettings.darkMode = isDarkMode;
          return this.http.put<PersonalSettings>(`/portal/private/v1/settings/personal`, perSettings);
        })
      )
      .pipe(
        tap(res => {
          this.personalSettingStore.update(res);
        })
      );
  }

  updateAppSettings(app: PersonalAppSettings, isNoStore = false): Observable<PersonalSettings> {
    return this.http
      .get<PersonalSettings>(`/portal/private/v1/settings/personal`)
      .pipe(
        mergeMap(perSettings => {
          perSettings.apps = perSettings.apps || [];
          const index = perSettings.apps.findIndex(i => i.appId === app.appId && i.orgUuid === app.orgUuid);
          if (index === -1) {
            perSettings.apps.push(app);
          } else {
            perSettings.apps[index] = app;
          }
          return this.http.put<PersonalSettings>(`/portal/private/v1/settings/personal`, perSettings);
        })
      )
      .pipe(
        tap(res => {
          if (!isNoStore) {
            this.personalSettingStore.update(res);
          }
        })
      );
  }

  updateStorePersonal(app: PersonalAppSettings) {
    const perSettings = Object.assign({}, this.personalSettingStore.getValue());
    perSettings.apps = perSettings.apps || [];
    const index = perSettings.apps.findIndex(i => i.appId === app.appId && i.orgUuid === app.orgUuid);
    if (index === -1) {
      perSettings.apps.push(app);
    } else {
      perSettings.apps[index] = app;
    }
    this.personalSettingStore.update({
      apps: perSettings.apps.slice() // clone array -> trigger select `apps`
    });
  }
}
