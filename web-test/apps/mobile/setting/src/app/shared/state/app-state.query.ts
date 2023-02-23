import { Injectable } from '@angular/core';
import { LicenseFeatureCode } from '@b3networks/api/license';
import { Query } from '@datorama/akita';
import { filter, map } from 'rxjs/operators';
import { AppState } from './app-state.model';
import { AppStateStore } from './app-state.store';

@Injectable({ providedIn: 'root' })
export class AppStateQuery extends Query<AppState> {
  loading$ = this.select('loading');
  assignedFeatureCodes$ = this.select('assignedFeatureCodes');
  hasBrowserLicense$ = this.select('assignedFeatureCodes').pipe(
    filter(f => f != null),
    map(
      features =>
        features.includes(LicenseFeatureCode.team_chat) && features.includes(LicenseFeatureCode.browser_device)
    )
  ); // TODO this is hardcoding for show browser when having team_chat only. Need remove after backend migrated data

  constructor(protected override store: AppStateStore) {
    super(store);
  }
}
