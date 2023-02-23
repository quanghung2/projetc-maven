import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import {
  IAM_SERVICES,
  IAM_UI_ACTIONS,
  IdentityProfileQuery,
  IdentityProfileService,
  MeIamQuery,
  MeIamService,
  ProfileOrg,
  Team,
  TeamQuery,
  TeamService,
  UpdateIAMReq
} from '@b3networks/api/auth';
import { DeviceType } from '@b3networks/api/bizphone';
import { CallRecordingService, DisplayConfig } from '@b3networks/api/callrecording';
import { Pageable } from '@b3networks/api/common';
import { Contact } from '@b3networks/api/contact';
import {
  ActionCompliance,
  CallType,
  DNCByPassReason,
  EnumScope,
  GetReportV4Payload,
  Period,
  ReasonMapping,
  ReportV4Code,
  ResourceName,
  ScopeHistoryService,
  StatusCall,
  UnifiedHistory,
  V4Service
} from '@b3networks/api/data';
import { ComplianceService } from '@b3networks/api/dnc';
import { FileService } from '@b3networks/api/file';
import { UnifiedHistoryFilter } from '@b3networks/api/portal';
import {
  DestroySubscriberComponent,
  donwloadFromUrl,
  downloadData,
  getFilenameFromHeader,
  TimeRangeHelper,
  TimeRangeKey,
  X
} from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { format } from 'date-fns-tz';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { catchError, delay, filter, finalize, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'poh-unified-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class HistoryComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  readonly CallType = CallType;
  readonly Scope = EnumScope;
  readonly DeviceType = DeviceType;
  readonly StatusCall = StatusCall;
  readonly DNCByPassReason: HashMap<string> = DNCByPassReason;
  readonly ReasonMapping: HashMap<string> = ReasonMapping;
  readonly ResourceName = ResourceName;
  readonly ActionCompliance = ActionCompliance;
  readonly statusesOnlyInPersonalScope = [StatusCall.delegated, StatusCall.redirection];

  @Input() isUnifiedWorkspace: boolean;
  @Input() noTitle: boolean;
  @Input() noDateRange: boolean;
  @Input() noTeams: boolean;
  @Input() contact: Contact;
  @Input() filter: UnifiedHistoryFilter = {
    teamUuid: '',
    timeRange: TimeRangeKey.today,
    startDate: null,
    endDate: null,
    inputSearch: '',
    callType: CallType.all,
    status: StatusCall.all
  };
  @ViewChild('sidenav') sidenav: MatSidenav;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;

  currentOrg$: Observable<ProfileOrg>;

  timeZone: string;
  managedTeams: Team[] = [];
  loading: boolean;
  loadingDownload: boolean;
  expandedElement: string;
  hasDnc: boolean;
  isExpand: boolean;

  displayConfig: DisplayConfig = {
    playButton: false,
    downloadButton: false,
    useLocalLink: false,
    localLinkPrefix: null
  };

  columns = ['txnUuid', 'type', 'startTime', 'caller', 'to', 'talkDurationAndTotalDuration', 'status'];

  columnsChild = [
    'legUuid',
    'type',
    'startTime',
    'endTime',
    'callerID',
    'participant',
    'status',
    'callRecording',
    'voiceMail'
  ];
  ui = {
    paging: new Pageable(1, 10),
    backUpPrevious: <UnifiedHistory[]>null,
    currentHistories: <UnifiedHistory[]>[],
    backUpNext: <UnifiedHistory[]>null
  };
  currentLegHistories: UnifiedHistory[] = [];
  txnMapping: { [key: string]: UnifiedHistory[] } = {};
  selectedHistory: UnifiedHistory;

  hideCallRecording: boolean;

  private _contactUuid: string;

  constructor(
    private route: ActivatedRoute,
    private scopeHistoryService: ScopeHistoryService,
    private toastService: ToastService,
    private fileService: FileService,
    private profileQuery: IdentityProfileQuery,
    private profileService: IdentityProfileService,
    private complianceService: ComplianceService,
    private callRecordingService: CallRecordingService,
    private v4Service: V4Service,
    private teamQuery: TeamQuery,
    private teamService: TeamService,
    private meIamQuery: MeIamQuery,
    private meIamService: MeIamService
  ) {
    super();
  }

  get reportCode() {
    return this.filter.teamUuid === EnumScope.personal
      ? ReportV4Code.unifiedHistory2LegWeb
      : ReportV4Code.unifiedHistory2CallWeb;
  }

  ngOnInit(): void {
    this.loading = true;

    this.complianceService.get().subscribe(res => {
      if (res) {
        this.hasDnc = true;
      }
    });

    this.callRecordingService.getDisplayConfig().subscribe(res => {
      this.displayConfig = res;
    });

    const req = {
      service: IAM_SERVICES.ui,
      action: IAM_UI_ACTIONS.hide_call_recording
    } as UpdateIAMReq;

    this.currentOrg$ = this.meIamService
      .verifyUser(req)
      .pipe(
        tap(_ => (this.hideCallRecording = true)),
        catchError(_ => of(null))
      )
      .pipe(
        switchMap(_ => {
          return this.profileQuery.currentOrg$;
        })
      )
      .pipe(
        filter(org => org != null),
        take(1),
        tap(async org => {
          this.timeZone = org.utcOffset;

          if (this.isUnifiedWorkspace) {
            this.managedTeams = [<Team>{ uuid: EnumScope.personal, name: 'Me' }];
            this.filter.teamUuid = this.managedTeams[0].uuid;
            this.onFilterChanged();
            return;
          }

          // not Unified Workspace app
          if (org.licenseEnabled) {
            combineLatest([
              this.teamQuery.selectAll(),
              this.teamQuery.selectAllManagedByAdmin(this.profileQuery.identityUuid)
            ])
              .pipe(takeUntil(this.destroySubscriber$))
              .subscribe(async ([teams, managedTeams]) => {
                const isManagedEveryone = org.isOwner || (!managedTeams.length && org.isUpperAdmin);

                this.managedTeams = [<Team>{ uuid: EnumScope.personal, name: 'Me' }];

                if (isManagedEveryone) {
                  this.managedTeams.push(<Team>{ uuid: EnumScope.org, name: 'Everyone' });
                }

                this.managedTeams = this.managedTeams.concat(isManagedEveryone ? teams : managedTeams);

                let teamUuid = this.filter.teamUuid || '';
                if (this.managedTeams.length && !this.filter.teamUuid) {
                  teamUuid = this.managedTeams[0].uuid;
                }
                if (this.filter.teamUuid !== teamUuid) {
                  this.filter.teamUuid = teamUuid;
                }
                this.onFilterChanged();
              });
          } else {
            let scopes = [EnumScope.personal];
            this.managedTeams = [];
            try {
              // for sub users
              scopes = await this.scopeHistoryService
                .getScopeUser()
                .pipe(catchError(_ => of([])))
                .toPromise();

              if (scopes.includes(EnumScope.team)) {
                this.managedTeams = await this.profileService.getTeams().toPromise();
              }

              if (!this.managedTeams.length) {
                const index = scopes.indexOf(EnumScope.team);
                if (index > -1) {
                  scopes.splice(index, 1);
                }
              }
            } catch (_) {}

            if (scopes.includes(EnumScope.org)) {
              this.managedTeams.unshift(<Team>{ uuid: EnumScope.org, name: 'Everyone' });
            }

            if (scopes.includes(EnumScope.personal)) {
              this.managedTeams.unshift(<Team>{ uuid: EnumScope.personal, name: 'Me' });
            }

            if (this.managedTeams.length > 0) {
              this.filter.teamUuid = this.managedTeams[0].uuid;
            }
            this.onFilterChanged();
          }
        })
      );

    this.profileQuery.currentOrg$
      .pipe(
        filter(x => x != null),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(org => {
        if (org.isUpperAdmin && this.teamQuery.hasntLoaded(X.orgUuid)) {
          this.teamService.getTeams(X.orgUuid).subscribe();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isUnifiedWorkspace']) {
      if (this.isUnifiedWorkspace) {
        this.filter.timeRange = TimeRangeKey.last30days;
        this.columns = this.columns.filter(x => x !== 'txnUuid');
        this.columnsChild = this.columnsChild.filter(x => x !== 'legUuid');
        if (this.hideCallRecording) {
          this.hideCallRecordingColumn();
        }
      }
    }

    if (changes['contact'] && this.contact.uuid !== this._contactUuid) {
      this._contactUuid = this.contact.uuid;
      // reset filter
      this.filter = {
        teamUuid: EnumScope.personal,
        timeRange: TimeRangeKey.last30days,
        startDate: null,
        endDate: null,
        inputSearch: '',
        callType: CallType.all,
        status: StatusCall.all
      };
      this.onFilterChanged();
    }
  }

  onFilterChanged() {
    // reset paging
    this.ui.paging.page = 1;
    this.expandedElement = null;
    this.switchStatusIfNotAvailable();
    this.filterDisplayedColumns();
    this.fetchDataHistories();
    this.closeSidenav();
  }

  filterDisplayedColumns() {
    this.columns = [
      'txnUuid',
      'type',
      'startTime',
      'caller',
      'to',
      'talkDurationAndTotalDuration',
      'status',
      'metadata'
    ];
    const isPersonalScope = this.filter.teamUuid === EnumScope.personal;
    if (isPersonalScope) {
      this.columns = [
        'txnUuid',
        'legUuid',
        'type',
        'startTime',
        'caller',
        'to',
        'talkDurationAndTotalDuration',
        'status',
        'callRecording',
        'voiceMail',
        'metadata'
      ];
    }

    if (this.hideCallRecording) {
      this.hideCallRecordingColumn();
    }
  }

  hideCallRecordingColumn() {
    this.columns = this.columns.filter(c => c !== 'callRecording');
    this.columnsChild = this.columnsChild.filter(c => c !== 'callRecording');
  }

  onDownloadHistory(type: string) {
    this.downloadCallHistory(type);
  }

  trackTask(index: number, item: UnifiedHistory): string {
    return `${item.txnUuid}`;
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  fetchMediaUrl(history: UnifiedHistory, type: ResourceName) {
    if (this.displayConfig.useLocalLink) {
      this.callRecordingService.getLocalLink(history.resources[type]?.fileKey).subscribe(l => {
        const fileName = l.localLink.split('/')[l.localLink.split('/').length - 1];
        history.fileCallRecording = { filename: fileName, downloadUrl: l.localLink };
      });
    } else {
      this.downloadCRFile(history, type).subscribe(
        _ => {},
        err => {
          this.toastService.error('You have no permission to access the resource');
          this.trigger.closeMenu();
        }
      );
    }
  }

  downloadFile(history: UnifiedHistory, type: ResourceName) {
    if (type === ResourceName.RECORDING && !!history.resources[type].mirrorUrl) {
      window.open(history.resources[type].mirrorUrl, '_blank');
    } else {
      if (this.displayConfig.useLocalLink) {
        this.callRecordingService.getLocalLink(history.resources[type]?.fileKey).subscribe(l => {
          const fileName = l.localLink.split('/')[l.localLink.split('/').length - 1];
          donwloadFromUrl(l.localLink, fileName);
        });
      } else {
        of(history.fileCallRecording)
          .pipe(switchMap(file => (file != null ? of(file) : this.downloadCRFile(history, type))))
          .subscribe(data => {
            donwloadFromUrl(data.downloadUrl, data.filename, () => {
              URL.revokeObjectURL(data.downloadUrl);
            });
          });
      }
    }
  }

  onErrorLoadFile() {
    this.toastService.error('Cannot load file');
  }

  prevPage() {
    this.loading = true;
    this.closeSidenav();
    this.ui.backUpNext = this.ui.currentHistories;
    this.ui.currentHistories = this.ui.backUpPrevious;
    this.ui.backUpPrevious = null;
    this.ui.paging.page--;
    this.loadMore(false);
  }

  nextPage() {
    this.loading = true;
    this.closeSidenav();
    this.ui.backUpPrevious = this.ui.currentHistories;
    this.ui.currentHistories = this.ui.backUpNext;
    this.ui.backUpNext = null;
    this.ui.paging.page++;
    this.loadMore(true);
  }

  downloadCallHistory(type: string) {
    this.loadingDownload = true;
    const req = <GetReportV4Payload>this.buildRequest();
    this.v4Service
      .downloadReport2(Period['dump'], ReportV4Code.unifiedHistoryDownload[type], req, {
        orgUuid: X.orgUuid,
        sessionToken: X.sessionToken
      })
      .pipe(finalize(() => (this.loadingDownload = false)))
      .subscribe(response => {
        downloadData(
          new Blob([response.body], { type: 'text/csv;charset=utf-8;' }),
          getFilenameFromHeader(response.headers)
        );
      });
  }

  onToggleExpand() {
    this.expandedElement = null;
    this.isExpand = !this.isExpand;
  }

  expand(row: UnifiedHistory) {
    if (this.filter.teamUuid === EnumScope.personal) {
      return;
    }
    this.expandedElement = this.expandedElement === row.txnUuid ? null : row.txnUuid;
  }

  private fetchDataHistories() {
    this.isExpand = false;
    const next = Object.assign({}, this.ui.paging);
    next.page++;
    const req = this.buildRequest();
    this.loading = true;
    let api$;
    if (this.isUnifiedWorkspace && (!this.contact?.numbers || this.contact?.numbers?.length === 0)) {
      api$ = of([[], []]).pipe(delay(0)); // or use changedetectRef, onChange lifecycle
    } else {
      api$ = forkJoin([
        this.v4Service.getReportData<UnifiedHistory>(Period.dump, this.reportCode, req, this.ui.paging, false).pipe(
          map(res =>
            res.rows.map(h => {
              h.agents = h.agents?.map(a => {
                const agent = h.legs?.find(l => l?.identityUuid === a?.identityUuid);
                return agent ? { ...a, extensionKey: agent.extensionKey, extensionLabel: agent.extensionLabel } : a;
              });
              h.showVoicemail = h.accessors?.some(a => [X.orgUuid, this.profileQuery.identityUuid].includes(a));
              return new UnifiedHistory(h);
            })
          )
        ),
        this.v4Service.getReportData<UnifiedHistory>(Period.dump, this.reportCode, req, next, false).pipe(
          map(res =>
            res.rows.map(h => {
              h.agents = h.agents?.map(a => {
                const agent = h.legs?.find(l => l.identityUuid === a.identityUuid);
                return agent ? { ...a, extensionKey: agent.extensionKey, extensionLabel: agent.extensionLabel } : a;
              });
              h.showVoicemail = h.accessors?.some(a => [X.orgUuid, this.profileQuery.identityUuid].includes(a));
              return new UnifiedHistory(h);
            })
          )
        )
      ]);
    }

    api$.pipe(finalize(() => (this.loading = false))).subscribe(res => {
      this.ui.currentHistories = res[0];
      this.ui.backUpNext = res[1];
      this.fetchLegHistories();
    });
  }

  private loadMore(isNext: boolean) {
    this.isExpand = false;
    const handlePage = Object.assign({}, this.ui.paging);
    handlePage.page = isNext ? handlePage.page + 1 : handlePage.page - 1;
    if (handlePage.page === 0) {
      this.fetchLegHistories();
      this.loading = false;
      return;
    }
    this.v4Service
      .getReportData<UnifiedHistory>(Period.dump, this.reportCode, this.buildRequest(), handlePage, false)
      .pipe(
        map(res =>
          res.rows.map(h => {
            h.agents = h.agents?.map(a => {
              const agent = h.legs?.find(l => l.identityUuid === a.identityUuid);
              return agent ? { ...a, extensionKey: agent.extensionKey, extensionLabel: agent.extensionLabel } : a;
            });
            h.showVoicemail = h.accessors?.some(a => [X.orgUuid, this.profileQuery.identityUuid].includes(a));
            return new UnifiedHistory(h);
          })
        ),
        finalize(() => (this.loading = false))
      )
      .subscribe(
        histories => {
          if (isNext) {
            this.ui.backUpNext = histories;
          } else {
            this.ui.backUpPrevious = histories;
          }
          this.fetchLegHistories();
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  private buildRequest(): GetReportV4Payload {
    this.filter.startDate?.setSeconds(0);
    this.filter.endDate?.setSeconds(0);

    const req = <GetReportV4Payload>{};
    const timeRange = TimeRangeHelper.buildTimeRangeFromKey(this.filter.timeRange, this.timeZone);
    if (this.filter.timeRange === TimeRangeKey.specific_date) {
      timeRange.startDate = format(new Date(this.filter.startDate), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timeZone
      });
      timeRange.endDate = format(
        this.filter.endDate ? new Date(this.filter.endDate) : new Date(),
        "yyyy-MM-dd'T'HH:mm:ssxxx",
        {
          timeZone: this.timeZone
        }
      );
    }

    req.startTime = timeRange.startDate;
    req.endTime = timeRange.endDate;
    req.filter = {
      status: this.filter.status !== StatusCall.all ? this.filter.status : [],
      hasResource: this.filter.hasResource,
      hasRecording: this.filter.hasRecording,
      hasVoicemail: this.filter.hasVoicemail
    };
    if (this.filter.callType !== CallType.all) {
      req.filter.type = this.filter.callType;
    } else {
      delete req.filter.type;
    }
    if (this.filter.campaignUuid) {
      req.filter = {
        ...req.filter,
        'callcenter.campaignUuid': this.filter.campaignUuid
      };
    }
    this.buildParamsWithFilter(req, this.filter);
    return req;
  }

  private buildParamsWithFilter(req: GetReportV4Payload, fil: UnifiedHistoryFilter) {
    req.scope = [EnumScope.personal, EnumScope.org].includes(fil.teamUuid as EnumScope) ? fil.teamUuid : EnumScope.team;

    if (req.scope === EnumScope.team) {
      if (fil.teamUuid) {
        req.teamUuid = fil.teamUuid;
      }
    }

    let query = '';
    const and = ' AND ';
    if (!!this.contact && this.contact?.numbers?.length > 0) {
      this.contact.numbers?.forEach(item => {
        query += query ? and : '';
        query += '("' + item.number.trim() + '"' + ' OR ' + '"+' + item.number.trim() + '")';
      });
    }

    if (fil.inputSearch) {
      query += query ? and : '';
      query += '("' + fil.inputSearch.trim() + '"' + ' OR ' + '"+' + fil.inputSearch.trim() + '")';
    }

    req.queryString = query ? query : null;
  }

  private downloadCRFile(history: UnifiedHistory, type: ResourceName) {
    const fileKey = history.resources[type].fileKey;
    return this.fileService.downloadFileV3(fileKey).pipe(
      map(resp => {
        const file = new Blob([resp.body], { type: `${resp.body.type}` });
        const downloadUrl = URL.createObjectURL(file);
        return { filename: getFilenameFromHeader(resp.headers), downloadUrl: downloadUrl };
      }),
      tap(data => (history.fileCallRecording = data))
    );
  }

  private fetchLegHistories() {
    if (this.filter.teamUuid === EnumScope.personal) {
      return;
    }
    const req = this.buildRequest();
    req.filter = {
      txnUuid: this.ui.currentHistories?.map(h => h.txnUuid)
    };
    req.queryString = undefined;
    this.v4Service
      .getReportData<UnifiedHistory>(
        Period.dump,
        ReportV4Code.unifiedHistory2LegWeb,
        req,
        {
          page: 1,
          perPage: 1000
        },
        false
      )
      .pipe(map(res => res.rows.map(x => new UnifiedHistory(x))))
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.currentLegHistories = res;
        this.txnMapping = this.currentLegHistories?.reduce((acc, item, index, histories) => {
          acc[item.txnUuid] = histories
            ?.filter(h => h.txnUuid === item.txnUuid)
            ?.map(h => {
              h.showVoicemail = h.accessors?.some(a => [X.orgUuid, this.profileQuery.identityUuid].includes(a));
              return h;
            });
          return acc;
        }, {});
      });
  }

  openMetaData(history: UnifiedHistory, event: MouseEvent) {
    event.stopPropagation();
    this.selectedHistory = history;
    this.sidenav.open();
  }

  closeSidenav() {
    this.sidenav?.close();
    this.selectedHistory = null;
  }

  switchStatusIfNotAvailable() {
    const isOrgOrTeamScope = this.filter.teamUuid !== EnumScope.personal;
    const statusesNotAvailable = this.statusesOnlyInPersonalScope.includes(this.filter.status);
    if (isOrgOrTeamScope && statusesNotAvailable) {
      this.filter.status = StatusCall.all;
    }
  }
}
