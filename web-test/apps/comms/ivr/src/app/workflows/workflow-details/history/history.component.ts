import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Page, Pageable } from '@b3networks/api/common';
import {
  HistoryService,
  SearchRequest,
  SensitiveSettings,
  SettingsService,
  Txn,
  User,
  UserService,
  VoiceMailRes
} from '@b3networks/api/ivr';
import { AppGlobal } from '@b3networks/comms/ivr/shared';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { addDays, endOfDay, format, min, startOfDay, subDays, subMonths } from 'date-fns';
import * as _ from 'lodash';
import { finalize, mergeMap } from 'rxjs/operators';
import { CallJourneyComponent } from './call-journey/call-journey.component';
import { ExportHistoryComponent } from './export-history/export-history.component';

@Component({
  selector: 'b3n-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  readonly defaultColumns: string[] = [
    'uuid',
    'callType',
    'source',
    'accessNumber',
    'usableStartTime',
    'usableDuration',
    'usableExtensions',
    'endPoint',
    'status',
    'details',
    'callJourney'
  ];
  displayedColumns: string[] = [];
  readonly timeRangeOptions: KeyValue<string, string>[] = [
    { key: '1', value: 'Last 1 day' },
    { key: '7', value: 'Last 1 week' },
    { key: '30', value: 'Last 1 month' },
    { key: 'custom', value: 'Custom' }
  ];
  readonly defaultTagOptions: KeyValue<string, string>[] = [
    { key: 'pressed_digits', value: 'Press Digits' },
    { key: 'endpoint', value: 'Endpoint' },
    { key: 'voice_mail', value: 'Voice Mail' }
  ];
  tagOptions: KeyValue<string, string>[] = [];
  workflowUuid: string;
  isLoading: boolean;
  pageable = <Pageable>{ page: 1, perPage: 10 };
  historyPage = new Page<Txn>();
  selectedTimeRangeOption: string;
  appNameMap: any = this.appGlobal.appNameMap;
  selectedAppId: string;

  startTime: string;
  endTime: string;
  minFrom = new Date();
  maxFrom = new Date();
  minTo = new Date();
  maxTo = new Date();

  searchRequest = new SearchRequest();
  searching: boolean;
  user: User;
  sensitiveSettings: SensitiveSettings;

  constructor(
    private route: ActivatedRoute,
    private historyService: HistoryService,
    private appGlobal: AppGlobal,
    private spinner: LoadingSpinnerSerivce,
    private dialog: MatDialog,
    private userService: UserService,
    private toastService: ToastService,
    private settingService: SettingsService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.route.params
      .pipe(
        mergeMap(params => {
          this.workflowUuid = params['uuid'];
          return this.settingService.getSensitiveSettings(params['uuid']);
        })
      )
      .subscribe(
        data => {
          this.sensitiveSettings = data;
          const storePressedKeys = this.sensitiveSettings.data.storePressedDigits;
          this.tagOptions = storePressedKeys
            ? this.defaultTagOptions
            : this.defaultTagOptions.filter(tag => tag.key !== 'pressed_digits');
          this.displayedColumns = storePressedKeys
            ? this.defaultColumns
            : this.defaultColumns.filter(column => column !== 'usableExtensions');

          this.selectedTimeRangeOption = '1';
          this.selectedAppId = '';

          this.searchRequest = new SearchRequest();
          this.searchRequest.workflowUuid = this.workflowUuid;

          this.search();
          this.isLoading = false;
          this.spinner.hideSpinner();
        },
        error => {
          this.toastService.error(error.message, 5000);
          this.spinner.hideSpinner();
        }
      );
  }

  onChangeTimeRange(option) {
    this.startTime = '';
    this.endTime = '';

    this.selectedTimeRangeOption = option;
    if (option !== 'custom') {
      const days = Number(option);
      this.searchRequest.from = Number(format(subDays(new Date(), days), 'T'));
      this.searchRequest.to = Number(format(new Date(), 'T'));
      this.pageable.page = 1;
      this.search();
    } else {
      this.minFrom = subMonths(new Date(), 3);
      this.maxFrom = new Date();

      setTimeout(() => {
        document.getElementById('from-input').removeAttribute('disabled');
      }, 0);
    }
  }
  onChangeQuery() {
    this.pageable.page = 1;
    this.search();
  }

  onChangeStartTime(event: any) {
    this.startTime = event.value;

    this.searchRequest.from = Number(format(startOfDay(new Date(event.value)), 'T'));

    this.minTo = new Date(this.startTime);
    this.maxTo = min([new Date(), addDays(new Date(this.startTime), 30)]);

    if (this.endTime) {
      this.search();
    }
  }

  onChangeEndTime(event: any) {
    this.pageable.page = 1;
    this.endTime = event.value;
    this.searchRequest.to = Number(format(endOfDay(new Date(event.value)), 'T'));

    this.maxFrom = new Date(this.endTime);
    this.search();
  }

  onChangePage(page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.search();
  }

  search() {
    if (this.searchRequest.from >= this.searchRequest.to) {
      return;
    }
    if (this.searchRequest.query) {
      this.searching = true;
      this.searchRequest.query = this.searchRequest.query.trim();
    }
    if (this.searchRequest.query && !this.searchRequest.query.includes('+')) {
      this.searchRequest.query = '+' + this.searchRequest.query;
    }
    this.userService.fetchUser().subscribe(user => {
      this.user = user;
      this.searchRequest.timezone = user.timezone;
      this.fetchHistories();
    });
  }

  fetchHistories() {
    this.spinner.showSpinner();
    this.historyService
      .fetchHistories(this.searchRequest, this.pageable)
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(
        data => {
          this.historyPage = data;

          this.formatHistories();
        },
        (err: any) => {
          this.toastService.error('Unexpected error happened while fetching histories. Please try again later.');
        }
      );
  }

  private formatHistories() {
    _.forEach(this.historyPage.content, (item: Txn) => {
      item.usableExtensions = _.map(item.extensions, (ext: string) => {
        if (!ext) {
          return '_';
        }

        return ext;
      });
    });
  }

  updateFilterTags(tag: string) {
    const index = this.searchRequest.filters.indexOf(tag);
    if (index != -1) {
      this.searchRequest.filters = _.filter(this.searchRequest.filters, item => {
        return item != tag;
      });
    } else {
      this.searchRequest.filters.push(tag);
    }
    this.pageable.page = 1;
    this.search();
  }

  openExportDialog() {
    this.dialog.open(ExportHistoryComponent, {
      width: '600px',
      data: <ExportHistoryDialogData>{
        from: Number(format(startOfDay(new Date(this.searchRequest.from)), 'T')),
        to: Number(format(startOfDay(new Date(this.searchRequest.to)), 'T')),
        workFlowUuid: this.workflowUuid,
        query: this.searchRequest.query,
        email: this.user.email
      }
    });
  }

  cancelSearch() {
    this.pageable.page = 1;
    this.searchRequest.query = '';
    this.search();
    this.searching = false;
  }

  downloadVoiceMail(txn: Txn) {
    this.spinner.showSpinner();
    this.historyService
      .getVoiceMailURL(txn.txnUuid)
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(
        (data: VoiceMailRes) => {
          window.open(data.url, '_blank');
        },
        err => this.toastService.error(`Cannot download voicemail. Please try again later!`)
      );
  }

  openCallJourney(txn: Txn) {
    this.dialog.open(CallJourneyComponent, {
      data: txn,
      minWidth: '450px',
      autoFocus: false
    });
  }

  resetTimeRange() {
    this.startTime = '';
    this.endTime = '';
    this.minFrom = subMonths(new Date(), 3);
    this.maxFrom = new Date();
  }
}

export interface ExportHistoryDialogData {
  from: number;
  to: number;
  workFlowUuid: string;
  query: string;
  email: string;
}
