import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IAMMember } from '@b3networks/api/auth';
import { QueueInfo } from '@b3networks/api/callcenter';
import { HashMap } from '@datorama/akita';
import { BehaviorSubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ConfigPieV2,
  Dashboard2,
  Dashboard2Card,
  Dashboard2DateTime,
  DashboardMap,
  DashboardPermission,
  GlobalConfig,
  IAM_DASHBOARD_SERVICE,
  Management,
  PublicDevice,
  QuestionV2,
  Starred
} from './dashboard-v2.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardV2Service {
  //* question error
  private _questionErrorHash: HashMap<string> = {};
  private _questionErrorHash$ = new BehaviorSubject<HashMap<string>>(this._questionErrorHash);
  questionErrorHash$$ = this._questionErrorHash$.asObservable();
  setQuestionErrorHash(uuid: string, error: string) {
    this._questionErrorHash[uuid] = error;
    this._questionErrorHash$.next(this._questionErrorHash);
  }

  //* queue filter
  private _queueFilterHash: HashMap<boolean> = {};
  private _queueFilterHash$ = new BehaviorSubject<HashMap<boolean>>(this._queueFilterHash);
  queueFilterHash$$ = this._queueFilterHash$.asObservable();
  queueUuids$ = new BehaviorSubject<string[]>(null);
  fetchQueue$ = new BehaviorSubject<boolean>(false);
  allQueues$ = new Subject<QueueInfo[]>();
  setQueueFilterHash(uuid?: string, hasQueueFilter?: boolean) {
    if (!uuid) {
      this._queueFilterHash = {};
    } else {
      this._queueFilterHash[uuid] = hasQueueFilter;
    }

    this._queueFilterHash$.next(this._queueFilterHash);
  }

  //* datetime filter
  private _dateTimeFilterHash: HashMap<boolean> = {};
  private _dateTimeFilterHash$ = new BehaviorSubject<HashMap<boolean>>(this._dateTimeFilterHash);
  dateTimeFilterHash$$ = this._dateTimeFilterHash$.asObservable();
  dateTime$ = new BehaviorSubject<Dashboard2DateTime>(null);
  setDateTimeFilterHash(uuid?: string, hasDateTimeFilter?: boolean) {
    if (!uuid) {
      this._dateTimeFilterHash = {};
    } else {
      this._dateTimeFilterHash[uuid] = hasDateTimeFilter;
    }

    this._dateTimeFilterHash$.next(this._dateTimeFilterHash);
  }

  //* include non queue filter
  private _includeNonQueueFilterHash: HashMap<boolean> = {};
  private _includeNonQueueFilterHash$ = new BehaviorSubject<HashMap<boolean>>(this._includeNonQueueFilterHash);
  includeNonQueueFilterHash$$ = this._includeNonQueueFilterHash$.asObservable();
  includeNonQueue$ = new BehaviorSubject<boolean>(true);
  setIncludeNonQueueFilterHash(uuid?: string, hasIncludeNonQueueFilter?: boolean) {
    if (!uuid) {
      this._includeNonQueueFilterHash = {};
    } else {
      this._includeNonQueueFilterHash[uuid] = hasIncludeNonQueueFilter;
    }

    this._includeNonQueueFilterHash$.next(this._includeNonQueueFilterHash);
  }

  //* state filter
  private _stateFilterHash: HashMap<boolean> = {};
  private _stateFilterHash$ = new BehaviorSubject<HashMap<boolean>>(this._stateFilterHash);
  stateFilterHash$$ = this._stateFilterHash$.asObservable();
  states$ = new BehaviorSubject<string[]>(null);
  setStateFilterHash(uuid?: string, hasStateFilter?: boolean) {
    if (!uuid) {
      this._stateFilterHash = {};
    } else {
      this._stateFilterHash[uuid] = hasStateFilter;
    }

    this._stateFilterHash$.next(this._stateFilterHash);
  }

  //* extension filter
  private _extensionFilterHash: HashMap<boolean> = {};
  private _extensionFilterHash$ = new BehaviorSubject<HashMap<boolean>>(this._extensionFilterHash);
  extensionFilterHash$$ = this._extensionFilterHash$.asObservable();
  extensionKeys$ = new BehaviorSubject<string[]>(null);
  fetchingExtension$ = new BehaviorSubject<boolean>(false);
  setExtensionsilterHash(uuid?: string, hasExtensionFilter?: boolean) {
    if (!uuid) {
      this._extensionFilterHash = {};
    } else {
      this._extensionFilterHash[uuid] = hasExtensionFilter;
    }

    this._extensionFilterHash$.next(this._extensionFilterHash);
  }

  //* filters width
  private _filtersWidthHash: HashMap<number> = {};
  private _filtersWidthHash$ = new BehaviorSubject<HashMap<number>>(this._filtersWidthHash);
  filtersWidthHash$$ = this._filtersWidthHash$.asObservable();
  setFiltersWidthHash(key?: string, width?: number) {
    if (!key) {
      this._filtersWidthHash = {};
    } else {
      this._filtersWidthHash[key] = width;
    }

    this._filtersWidthHash$.next(this._filtersWidthHash);
  }

  //* global config
  private globalConfig$ = new BehaviorSubject<GlobalConfig>(null);
  get globalConfig() {
    return this.globalConfig$.getValue();
  }

  userStateMap$ = new BehaviorSubject<HashMap<ConfigPieV2>>({});
  dashboard2Tabs$ = new Subject<Dashboard2[]>();
  dashboard2TabsChanged$ = new Subject<string>();
  starredUuids$ = new BehaviorSubject<string[]>([]);
  isPopupOpening$ = new BehaviorSubject<boolean>(false);
  isStoreSuccess$ = new Subject<number>();
  isTV$ = new BehaviorSubject<boolean>(false);

  resetDashboardFilterStreams() {
    this.setFiltersWidthHash();
    this.setQueueFilterHash();
    this.setDateTimeFilterHash();
    this.setIncludeNonQueueFilterHash();
    this.setStateFilterHash();
    this.setExtensionsilterHash();
  }

  getDashboardMap(iamMember: IAMMember): DashboardMap {
    const policies = iamMember?.iamPolicy?.policies ?? [];
    const dashboardPolicies = policies.filter(p => p.service === IAM_DASHBOARD_SERVICE);

    if (!dashboardPolicies.length) {
      return null;
    }

    if (dashboardPolicies[0].resources.length === 1 && dashboardPolicies[0].resources[0] === '*') {
      return '*';
    }

    const selectedDashboardMap = {};

    dashboardPolicies.forEach(policy => {
      policy.resources.forEach(uuid => {
        if (policy.action === DashboardPermission.READONLY) {
          selectedDashboardMap[uuid] = {
            ...selectedDashboardMap[uuid],
            [DashboardPermission.READONLY]: true
          };
        } else if (policy.action === DashboardPermission.MANAGE) {
          selectedDashboardMap[uuid] = {
            ...selectedDashboardMap[uuid],
            [DashboardPermission.MANAGE]: true
          };
        }
      });
    });

    return selectedDashboardMap;
  }

  constructor(private http: HttpClient) {}

  getDashboards() {
    return this.http
      .get<Dashboard2[]>(`/dashboard/private/v2/dashboards/*`)
      .pipe(map(dashboards => dashboards.map(d => new Dashboard2(d))));
  }

  getDashboardsByUuids(uuids: string[]) {
    return this.http
      .get<Dashboard2[]>(`/dashboard/private/v2/dashboards/${uuids.join(',')}`)
      .pipe(map(dashboards => dashboards.map(d => new Dashboard2(d))));
  }

  getAllDashboards() {
    return this.http
      .get<Dashboard2[]>(`/dashboard/private/v2/dashboards/admins`)
      .pipe(map(dashboards => dashboards.map(d => new Dashboard2(d))));
  }

  getDashboard(uuid: string) {
    return this.http.get<Dashboard2>(`/dashboard/private/v2/dashboards/${uuid}`).pipe(map(d => new Dashboard2(d)));
  }

  createDashboard(dashboard: Partial<Dashboard2>) {
    return this.http.post<Dashboard2>(`/dashboard/private/v2/dashboards`, dashboard);
  }

  updateDashboard(uuid: string, dashboard: Partial<Dashboard2>) {
    return this.http.put(`/dashboard/private/v2/dashboards/${uuid}`, dashboard);
  }

  deleteDashboard(uuid: string) {
    return this.http.delete(`/dashboard/private/v2/dashboards/${uuid}`);
  }

  getCards(dashboardUuid: string) {
    return this.http.get<Dashboard2Card[]>(`/dashboard/private/v2/dashboards/${dashboardUuid}/cards`).pipe(
      map(cards => {
        cards.sort((a, b) => a.config?.order - b.config?.order);
        return cards;
      })
    );
  }

  getCard(dashboardUuid: string, cardUuid: string) {
    return this.http.get<Dashboard2Card>(`/dashboard/private/v2/dashboards/${dashboardUuid}/cards/${cardUuid}`);
  }

  createCards(dashboardUuid: string, cards: Partial<Dashboard2Card>[]) {
    return this.http.post(`/dashboard/private/v2/dashboards/${dashboardUuid}/cards`, cards);
  }

  updateCards(dashboardUuid: string, cards: Partial<Dashboard2Card>[]) {
    return this.http.put(`/dashboard/private/v2/dashboards/${dashboardUuid}/cards-update`, cards);
  }

  // card uuids <= 10
  deleteCards(dashboardUuid: string, cardUuids: string) {
    return this.http.delete(`/dashboard/private/v2/dashboards/${dashboardUuid}/cards/${cardUuids}`);
  }

  getQuestions() {
    return this.http.get<QuestionV2[]>(`/dashboard/private/v2/questions`).pipe(
      map(questions => {
        return questions.map(q => new QuestionV2(q));
      })
    );
  }

  getQuestion(questionUuid: string) {
    return this.http.get<QuestionV2>(`/dashboard/private/v2/questions/${questionUuid}`);
  }

  getStarred() {
    return this.http.get<Starred>(`/dashboard/private/v2/dashboards/starred`);
  }

  getGlobalConfig() {
    const globalConfig = this.globalConfig$.getValue();

    if (globalConfig) {
      return this.globalConfig$;
    } else {
      return this.http.get<GlobalConfig>(`/dashboard/private/v2/global-config`).pipe(
        map(res => {
          const globalConfig = new GlobalConfig(res);
          this.globalConfig$.next(globalConfig);
          return globalConfig;
        })
      );
    }
  }

  getPublicDevices(everyone: boolean = false) {
    const params = new HttpParams().set('everyone', everyone);
    return this.http.get<PublicDevice[]>(`/dashboard/private/v2/public-access`, { params });
  }

  approveDevice(otp: string, dashboardUuids: string[]) {
    return this.http.post<PublicDevice>(`/dashboard/private/v2/public-access/approve/${otp}`, { dashboardUuids });
  }

  updateDevice(deviceId: string, device: Partial<PublicDevice>) {
    return this.http.put<PublicDevice>(`/dashboard/private/v2/public-access/update/${deviceId}`, device);
  }

  removeDevice(deviceId: string) {
    return this.http.delete(`/dashboard/private/v2/public-access/revoke/${deviceId}`);
  }

  checkDeviceStatus(deviceId: string) {
    return this.http.get<PublicDevice>(`/dashboard/private/v2/public-access/${deviceId}`);
  }

  getPublicDashboards(uuid: string, deviceId: string) {
    const params = new HttpParams().set('deviceId', deviceId);
    return this.http.get<Dashboard2[]>(`/dashboard/private/v2/dashboards/${uuid}/public-access`, { params });
  }

  getPublicCards(dashboardUuid: string, deviceId: string) {
    const params = new HttpParams().set('deviceId', deviceId);
    return this.http.get<Dashboard2Card[]>(`/dashboard/private/v2/dashboards/${dashboardUuid}/cards/public-access`, {
      params
    });
  }

  getManagements() {
    return this.http
      .get<Management[]>(`/dashboard/private/v2/management/acl`)
      .pipe(map(managements => managements.map(management => new Management(management))));
  }

  changeManagement(accessAll: boolean) {
    return this.http.put<Management>(`/dashboard/private/v2/management/acl?accessAll=${accessAll}`, {});
  }

  getExtManagement(identityUuid: string) {
    return this.http
      .get(`/dashboard/private/v2/management/acl/${identityUuid}`)
      .pipe(map(management => new Management(management)));
  }

  changeExtManagement(identityUuid: string, dashboardUuids: string[]) {
    return this.http.put<Management>(`/dashboard/private/v2/management/acl/${identityUuid}`, { dashboardUuids });
  }
}
