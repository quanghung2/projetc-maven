import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { AppType, History, ModalMessage, ModalService, MsApps, Pagination, UserService } from '../shared';
import { HistoryStatus, User } from '../shared/model';
import { Term } from '../shared/model/term.model';
import { HistoryService, TermService } from '../shared/service';
import { BackupConfigModalComponent } from './backup-config-modal/backup-config-modal.component';
import { ExportEmailModalComponent } from './export-email-modal/export-email-modal.component';
import { HistoryArchiveModalComponent } from './history-archive-modal/history-archive-modal.component';
import { HistoryArchivedModalComponent } from './history-archived-modal/history-archived-modal.component';
import { HistoryNoteModalComponent } from './history-note-modal/history-note-modal.component';

declare let jQuery: any;
declare let X: any;

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {
  @ViewChild('fromDateElement') fromDateElement: ElementRef;
  @ViewChild('toDateElement') toDateElement: ElementRef;
  @ViewChild('dropdownApp') dropdownApp: ElementRef;
  public searchForm = this.fb.group({
    query: ['', Validators.required]
  });

  public histories: Array<History>;
  public currentPage = 1;
  public maxPage = 999999;
  public sizePage = 8;
  public filterApp = 'all';
  public fromDate: number;
  public toDate: number;
  public searchQuery = '';
  public fetchingCsv = false;
  public user: User;
  public isManager = false;
  public isHasSub = false;
  public term: Term;

  readonly HistoryStatus = HistoryStatus;
  readonly AppType = AppType;

  constructor(
    private historyService: HistoryService,
    private msApps: MsApps,
    private modalService: ModalService,
    private fb: UntypedFormBuilder,
    private userService: UserService,
    private termService: TermService
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    try {
      setTimeout(() => {
        jQuery(this.dropdownApp.nativeElement)
          .find('.ui.dropdown')
          .dropdown({
            onChange: value => {
              this.filterApp = value;
              this.currentPage = 1;
              this.fetchHistories();
            }
          });

        const today = new Date();
        const fromDate = jQuery(this.fromDateElement.nativeElement)
          .find('.ui.calendar:first')
          .calendar({
            type: 'date',
            onChange: (date, text, mode) => {
              try {
                toDate.calendar('set startDate', date);
                toDate.calendar('set endDate', new Date(date.getFullYear(), date.getMonth() + 1));

                const td = toDate.calendar('get date');
                const daysBetween = Math.round((td - date) / (1000 * 60 * 60 * 24));
                if (td.getTime() < date.getTime()) {
                  toDate.calendar('set date', date);
                } else if (daysBetween > 31) {
                  toDate.calendar('set date', new Date(date.getFullYear(), date.getMonth() + 1));
                }

                if (this.fromDate != undefined && this.fromDate != date.getTime()) {
                  this.currentPage = 1;
                  this.fromDate = date.getTime();
                  this.fetchHistories();
                }
              } catch (e) {}
            }
          });

        const toDate = jQuery(this.toDateElement.nativeElement)
          .find('.ui.calendar:first')
          .calendar({
            type: 'date',
            startCalendar: jQuery('#from-date'),
            onChange: (date, text, mode) => {
              if (this.toDate != undefined && this.toDate != date.getTime()) {
                this.currentPage = 1;
                this.toDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
                this.fetchHistories();
              }
            }
          });

        // default last 1 days
        fromDate.calendar('set date', new Date(today.getFullYear(), today.getMonth(), today.getDate()));
        toDate.calendar('set date', new Date(today.getFullYear(), today.getMonth(), today.getDate()));

        this.updateDate();

        this.fetchHistories();
      }, 100);
    } catch (e) {
      console.error(e);
    }

    this.user = this.userService.getCurrentUser();
    this.initPermission();
    this.initTerm();
  }

  updateDate() {
    try {
      this.fromDate = jQuery(this.fromDateElement.nativeElement)
        .find('.ui.calendar:first')
        .calendar('get focusDate')
        .getTime();

      const to = jQuery(this.toDateElement.nativeElement).find('.ui.calendar:first').calendar('get focusDate');
      // until end of toDate
      this.toDate = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1).getTime();
    } catch (e) {}
  }

  doSearch(event) {
    this.searchQuery = this.searchForm.get('query').value.trim();
    this.updateDate();
    this.fetchHistories(1, true, this.searchQuery);
  }

  fetchHistories(
    page: number = this.currentPage,
    force: boolean = false,
    query: string = this.searchQuery,
    csv: boolean = false
  ) {
    this.currentPage = page;
    const params: any = {};

    if (query != undefined && query.length >= 3) {
      params.query = query.replace('+', '').trim();
    }

    if (this.filterApp != 'all') {
      params.app = this.filterApp;
    }

    // add fromDate for partition search
    // this.updateDate();
    if (this.fromDate != undefined) {
      params.from = this.fromDate;
    }
    if (this.toDate != undefined) {
      params.to = this.toDate;
    }

    if (!csv) {
      params.page = page;
      params.perPage = this.sizePage;

      this.histories = undefined;

      const historiesWaiter = this.historyService.getHistories(params);
      return this.msApps
        .getWithApps([historiesWaiter])
        .then(([histories, apps]: any) => {
          if (histories.total != undefined) {
            this.maxPage = Math.ceil(histories.total / this.sizePage);
          }
          return [histories.data, apps];
        })
        .then(([histories, apps]: any) => {
          this.parseHistories(histories);
        })
        .catch(err => {
          X.showWarn(
            'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
          );
        });
    } else {
      params.page = 1;
      params.perPage = 100000;

      this.historyService.getCsv(params).then((data: any) => {
        this.fetchingCsv = false;
      });
    }
    return true;
  }

  parseHistories(histories: Array<any>) {
    this.histories = [];

    if (histories == undefined) {
      return;
    }

    histories.forEach((history: History) => {
      // parse logo
      const app = this.msApps.getAppInfo(history.app);
      history.appLogo = app.appLogo;

      history.subscription = history.callTo;

      if (history.app == AppType.SIP) {
        const extra = history.getExtra();

        if (extra.callType.toLowerCase() == 'outgoing') {
          history.subscription = history.callFrom;

          if (extra.callerID != undefined) {
            history.callFrom += ` (${extra.callerID})`;
          }
        } else {
          if (extra.accessNumber != undefined) {
            history.callTo += ` (${extra.accessNumber})`;
          }
        }
      }
      this.histories.push(history);
    });
  }

  parseNote(note: string) {
    if (note == undefined) {
      return '-';
    }
    if (note.length < 10) {
      return note;
    }
    return note.substr(0, 10) + '...';
  }

  fetchHistoriesCsv() {
    this.fetchHistories(1, true, this.searchQuery, true);
  }

  exportCSV() {
    const params: any = {};

    if (this.filterApp != 'all') {
      params.app = this.filterApp;
    }

    // add fromDate for partition search
    // this.updateDate();
    if (this.fromDate != undefined) {
      params.from = this.fromDate;
    }
    if (this.toDate != undefined) {
      params.to = this.toDate;
    }

    params.page = 1;
    params.perPage = 100000;

    this.fetchingCsv = true;
    this.historyService
      .exportCSV(params)
      .then((data: any) => {
        this.fetchingCsv = false;
        X.showSuccess(
          'Your export request is being processed. It may take several minutes to generated. Once completed, the csv file will be sent to you via email ' +
            this.user.email
        );
      })
      .catch(err => {
        console.error(err);
        X.showWarn(
          'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
        );
      });
  }

  getPageList(currentPage: number = 1) {
    return Pagination.getPageList(currentPage, this.maxPage);
  }

  showNoteUpdate(history: History) {
    const message = new ModalMessage(HistoryNoteModalComponent, {
      history
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  showAchieve(history: History) {
    const message = new ModalMessage(HistoryArchiveModalComponent, {
      history
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  showAchieved(history: History) {
    const message = new ModalMessage(HistoryArchivedModalComponent, {
      history
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  showBackupConfig() {
    const message = new ModalMessage(BackupConfigModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }

  getDownloadLink(record: any, fileType: string) {
    this.historyService.fetchDownloadLink(record.txnUuid, fileType).then((data: any) => {
      window.open(data.url, '_blank');
    });
  }

  play(record: any) {
    this.historyService.fetchDownloadLink(record.txnUuid, 'mp3').then((data: any) => {
      record.popupContent =
        '<audio src="' +
        data.url +
        '" type="audio/mp3" controls autoplay preload="auto">' +
        'Your browser does not support the <code>audio</code> element.</audio>';
      setTimeout(() => {
        jQuery('#play-' + record.txnUuid)
          .popup({
            on: 'click'
          })
          .popup('show');
      }, 300);
    });
  }

  initPermission() {
    setTimeout(() => {
      if (!this.user) {
        this.isManager = false;
      } else {
        this.isManager = ['OWNER', 'ADMIN', 'SUPER_ADMIN'].indexOf(this.user.role) >= 0;
        this.isHasSub = this.user.isHasSub;
      }
    }, 0);
  }

  initTerm() {
    this.term = this.termService.getTerm();
  }

  showExportModal() {
    const params: any = {};

    if (this.filterApp != 'all') {
      params.app = this.filterApp;
    }

    // add fromDate for partition search
    // this.updateDate();
    if (this.fromDate != undefined) {
      params.from = this.fromDate;
    }
    if (this.toDate != undefined) {
      params.to = this.toDate;
    }

    params.page = 1;
    params.perPage = 100000;

    const message = new ModalMessage(ExportEmailModalComponent, {
      params: params,
      user: this.user
    });
    this.modalService.load(message);
    event.preventDefault();
  }
}
