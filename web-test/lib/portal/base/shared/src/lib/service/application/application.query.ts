import { Injectable } from '@angular/core';
import { APP_IDS } from '@b3networks/shared/common';
import { Order, QueryEntity } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppRenderType, PortalAppType, RenderStatus } from './application.model';
import { ApplicationState, ApplicationStore, _sortMenuFunc } from './application.store';

const CHAT_APPLICATION_IDS = [APP_IDS.WHATAPPS];

@Injectable({ providedIn: 'root' })
export class ApplicationQuery extends QueryEntity<ApplicationState> {
  rendering$ = this.select('renderingApp');

  constructor(protected override store: ApplicationStore) {
    super(store);
  }

  selectCountChatApplications(orgUuid: string) {
    return this.selectCount(e => e.orgUuid === orgUuid && e.isInstalled && CHAT_APPLICATION_IDS.indexOf(e.appId) > -1);
  }

  selectInstalledApplications(orgUuid: string) {
    return this.selectAll({
      filterBy: e => e.orgUuid === orgUuid && e.isInstalled,
      sortBy: _sortMenuFunc
    });
  }

  selectApplications(req: {
    orgUuid: string;
    installed?: boolean;
    appIds?: string[];
    notInAppIds?: string[];
    pinned?: boolean;
    isFeature?: boolean;
    type?: PortalAppType;
  }) {
    return this.selectAll({
      filterBy: e => {
        let expression = e.orgUuid === req.orgUuid;
        if (req.installed != null) {
          expression = req.installed ? expression && (e.isInstalled || e.isExternalApp) : expression && !e.isInstalled;
        }
        if (req.appIds && req.appIds.length) {
          expression = expression && req.appIds.indexOf(e.appId) > -1;
        }
        if (req.notInAppIds && req.notInAppIds.length) {
          expression = expression && req.notInAppIds.indexOf(e.appId) === -1;
        }
        if (req.pinned != null) {
          expression = req.pinned ? expression && e.pinned : expression && !e.pinned;
        }

        if (req.isFeature != null) {
          expression = req.isFeature ? expression && e.isFeatureApp : expression && !e.isFeatureApp;
        }
        if (req.type) {
          expression = expression && e.type === req.type;
        }

        return expression;
      },
      sortBy: _sortMenuFunc
    });
  }

  selectPinedApplication(orgUuid: string) {
    return this.selectAll({
      filterBy: e => e.orgUuid === orgUuid && e.isInstalled && e.pinned,
      sortBy: _sortMenuFunc,
      sortByOrder: Order.ASC
    });
  }

  selectActivatedIframeApps(orgUuid: string) {
    return this.selectAll({
      filterBy: e =>
        e.orgUuid === orgUuid && e.renderType === AppRenderType.iframe && e.renderStatus !== RenderStatus.unloaded,
      sortBy: 'renderedAt'
    });
  }

  selectActivatedElementApps(orgUuid: string) {
    return this.selectAll({
      filterBy: e =>
        e.orgUuid === orgUuid && e.renderType === AppRenderType.webComponent && e.renderStatus === RenderStatus.loaded
    });
  }

  selectNotificationCount(orgUuid: string): Observable<number> {
    return this.selectAll({ filterBy: e => e.orgUuid === orgUuid && e.isInstalled }).pipe(
      map(list => (list ? list.map(l => l.notificationCount).reduce((a, b) => a + b, 0) : 0))
    );
  }

  getApplicationbyId(orgUuid: string, path: string) {
    return this.getEntity(orgUuid + '_' + path);
  }

  selectApplicationbyId(orgUuid: string, path: string) {
    return this.selectEntity(orgUuid + '_' + path);
  }

  getPinnedApps(orgUuid: string) {
    return this.getAll().filter(a => a.orgUuid === orgUuid && a.pinned);
  }

  getOpenedApps(orgUuid: string) {
    return this.getAll().filter(a => a.orgUuid === orgUuid && a.renderStatus === RenderStatus.loaded);
  }

  getCountChatApplications(orgUuid: string) {
    return this.getCount(e => e.orgUuid === orgUuid && e.isInstalled && CHAT_APPLICATION_IDS.indexOf(e.appId) > -1);
  }

  getByOrgUuidAndAppId(orgUuid: string, appId: string) {
    const apps = this.getAll({
      filterBy: app => app.orgUuid === orgUuid && app.appId === appId
    });
    return apps.length ? apps[0] : null;
  }

  getLastActiveView(orgUuid: string) {
    return this.getValue().lastActiveApps[orgUuid];
  }

  get allRenderedApplications() {
    return this.getAll({ filterBy: e => e.renderStatus !== RenderStatus.unloaded });
  }

  isLoaded(orgUuid: string) {
    return this.getValue().loadedOrgs.indexOf(orgUuid) > -1;
  }
}
