import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as _ from 'lodash';
import { BackupConfigModalComponent } from '../history';
import { ExportEmailModalComponent } from '../history/export-email-modal/export-email-modal.component';
import { User } from '../shared/model';
import { Term } from '../shared/model/term.model';
import { ModalMessage, ModalService, TermService, UserService } from '../shared/service';
import { FileDownloadService } from '../shared/service/file-download.service';
import { NewHistoryService, QueryRequest } from '../shared/service/new-history.service';

declare let X: any;
declare let $: any;

@Component({
  selector: 'app-new-history',
  templateUrl: './new-history.component.html',
  styleUrls: ['./new-history.component.css']
})
export class NewHistoryComponent implements OnInit {
  @ViewChild('fromDateElement', { static: true }) fromDateElement: ElementRef;
  @ViewChild('toDateElement', { static: true }) toDateElement: ElementRef;
  @ViewChild('dropdownApp', { static: true }) dropdownApp: ElementRef;
  @ViewChild('dropdownMoreActions') dropdownMoreActions: ElementRef;

  public histories: NewHistory[];
  public user: User;
  public term: Term;

  public queryRequest: QueryRequest;
  public lastQueryRequest: QueryRequest;

  public appIconMapper: any = {
    sip: {
      name: 'SIP',
      icon: 'https://ui.b3networks.com/external/icon/sip_128x128.png'
    },
    sip_beta: {
      name: 'SIP Beta',
      icon: 'https://ui.b3networks.com/external/icon/sip_128x128.png'
    },
    biz_phone: {
      name: 'BizPhone',
      icon: 'https://ui.b3networks.com/external/icon/bizphone_128x128.png'
    },
    biz_phone_beta: {
      name: 'BizPhone Beta',
      icon: 'https://ui.b3networks.com/external/icon/bizphone_128x128.png'
    },
    direct_line: {
      name: 'Direct Line',
      icon: 'https://ui.b3networks.com/external/icon/directline_128x128.png'
    },
    direct_line_beta: {
      name: 'Direct Line Beta',
      icon: 'https://ui.b3networks.com/external/icon/directline_128x128.png'
    },
    virtual_line: {
      name: 'Virtual Line',
      icon: 'https://ui.b3networks.com/external/icon/virtualline_128x128.png'
    },
    virtual_line_beta: {
      name: 'Virtual Line Beta',
      icon: 'https://ui.b3networks.com/external/icon/virtualline_128x128.png'
    },
    extensions: {
      name: 'Extensions',
      icon: 'https://ui.b3networks.com/external/icon/bizphone_128x128.png'
    },
    extensions_beta: {
      name: 'Extensions Beta',
      icon: 'https://ui.b3networks.com/external/icon/bizphone_128x128.png'
    },
    wallboard: {
      name: 'Wallboard',
      icon: 'https://ui.b3networks.com/external/hoiio-assets/images/app-logo/1556165584635-1490582116190-Wallboard_512x512.png'
    },
    wallboard_beta: {
      name: 'Wallboard Beta',
      icon: 'https://ui.b3networks.com/external/hoiio-assets/images/app-logo/1556165584635-1490582116190-Wallboard_512x512.png'
    }
  };

  public pagination: LocalPagination;
  public showingHistories: NewHistory[];
  public loading: boolean;

  constructor(
    private historyService: NewHistoryService,
    private userService: UserService,
    private termService: TermService,
    private modalService: ModalService,
    private fileDownloadService: FileDownloadService
  ) {}

  ngOnInit() {
    this.histories = [];
    this.user = this.userService.getCurrentUser();
    this.term = this.termService.getTerm();
    this.queryRequest = new QueryRequest();
    this.pagination = new LocalPagination();
    this.showingHistories = [];
    this.loading = true;
  }

  ngAfterViewInit() {
    try {
      setTimeout(() => {
        $(this.dropdownApp.nativeElement)
          .find('.ui.dropdown')
          .dropdown({
            onChange: value => {
              if ('all' == value) {
                this.queryRequest.app = undefined;
              } else {
                this.queryRequest.app = value;
              }
              this.pagination = new LocalPagination();
              this.getHistories(1, 1);
            }
          });

        try {
          $(this.dropdownMoreActions.nativeElement).dropdown();
        } catch (e) {}

        const today = new Date();
        const fromDate = $(this.fromDateElement.nativeElement)
          .find('.ui.calendar:first')
          .calendar({
            type: 'date',
            onChange: (date, text, mode) => {
              this.queryRequest.fromTime = date.getTime();

              if (this.queryRequest.fromTime && this.queryRequest.toTime) {
                this.pagination = new LocalPagination();
                this.getHistories(1, 1);
              }
            }
          });

        const toDate = $(this.toDateElement.nativeElement)
          .find('.ui.calendar:first')
          .calendar({
            type: 'date',
            startCalendar: $('#from-date'),
            onChange: (date, text, mode) => {
              this.queryRequest.toTime = date.getTime();
              if (this.queryRequest.fromTime && this.queryRequest.toTime) {
                this.pagination = new LocalPagination();
                this.getHistories(1, 1);
              }
            }
          });

        // default last 1 days
        fromDate.calendar('set date', new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
        toDate.calendar('set date', new Date(today.getFullYear(), today.getMonth(), today.getDate()));
      }, 100);
    } catch (e) {
      console.error(e);
    }
  }

  getHistories(temporaryCurrentPage: number, temporaryRequestPage: number, needToCheckText: boolean = false) {
    if (!this.validateDateRange()) {
      X.showWarn('The date range is not valid or exceeds 31 days!');
      return;
    }

    if (needToCheckText && this.lastQueryRequest) {
      const isSame: boolean =
        this.lastQueryRequest.fromNumber == this.queryRequest.fromNumber &&
        this.lastQueryRequest.toNumber == this.queryRequest.toNumber;
      if (isSame) {
        return;
      }
    }

    this.loading = true;

    if (this.queryRequest.app) {
      this.queryRequest.app = this.queryRequest.app.trim();
    }

    if (this.queryRequest.fromNumber) {
      this.queryRequest.fromNumber = this.queryRequest.fromNumber.trim();
    }

    if (this.queryRequest.toNumber) {
      this.queryRequest.toNumber = this.queryRequest.toNumber.trim();
    }

    this.lastQueryRequest = Object.assign(new QueryRequest(), this.queryRequest);

    const params: QueryRequest = Object.assign(new QueryRequest(), this.queryRequest);
    params.timezone = this.user.timezone;
    params.toTime += 86400000;
    if (temporaryRequestPage) {
      params.page = temporaryRequestPage;
    }

    this.historyService
      .getHistories(params)
      .then(data => {
        if ((data as NewHistory[]).length > 0 || params.page == 1) {
          this.histories = <NewHistory[]>data;
          this.formatHistoriesData();

          if (temporaryCurrentPage > 0) {
            this.pagination.currentPage = temporaryCurrentPage;
          }

          if (this.pagination.currentPage < this.pagination.minPage) {
            this.pagination.maxPage = this.pagination.currentPage;
            this.pagination.minPage =
              this.pagination.maxPage -
              (Math.floor(this.histories.length / this.pagination.pageSize) -
                1 +
                (this.histories.length % this.pagination.pageSize > 0 ? 1 : 0));
          } else {
            this.pagination.minPage = this.pagination.currentPage;
            this.pagination.maxPage =
              this.pagination.minPage +
              Math.floor(this.histories.length / this.pagination.pageSize) -
              1 +
              (this.histories.length % this.pagination.pageSize > 0 ? 1 : 0);
          }

          this.queryRequest.page = temporaryRequestPage;
          this.pagination.isLastPage = false;
        } else {
          this.pagination.isLastPage = true;
          X.showWarn('No more records found.');
        }
        this.updateShowingHistoriesData();

        this.loading = false;
      })
      .catch((err: any) => {
        this.loading = false;
        console.error(err);
        X.showWarn('Error when fetching histories. Please try again later.');
      });
  }

  private formatHistoriesData() {
    _.forEach(this.histories, (item: NewHistory) => {
      item.subscription = item.dest;

      if (item.app == 'sip' && item.extra && item.sourceType == 'db') {
        const extra = JSON.parse(item.extra);

        if (extra.callType && extra.callType.toLowerCase() == 'outgoing') {
          item.subscription = item.callerId;

          if (extra.callerID != undefined) {
            item.callerId += ` (${extra.callerID})`;
          }
        } else {
          if (extra.accessNumber != undefined) {
            item.dest += ` (${extra.accessNumber})`;
          }
        }
      } else if (item.app == 'sip' && item.sourceType == 'ms-data') {
        try {
          if (item.callerId.match(/^[0-9]+/g)) {
            item.callerId = `+${item.callerId}`;
          }

          if (item.dest.match(/^[0-9]+/g)) {
            item.dest = `+${item.dest}`;
          }
        } catch (e) {}

        /*if (item.callerId && item.callerId.startsWith('sip:')) {
          item.callerId = item.callerId.substring(item.callerId.indexOf('sip:') + 4, item.callerId.indexOf('@sip'));
        }

        if (item.dest && item.dest.startsWith('sip:')) {
          item.dest = item.dest.substring(item.dest.indexOf('sip:') + 4, item.dest.indexOf('@sip'));
        }*/
      }
    });
  }

  getHistoriesWithUnFormatPagination(page: number = 1) {
    if (page < 1) {
      return;
    }

    if (page > this.pagination.maxPage) {
      this.getHistories(page, this.queryRequest.page + 1);
    } else if (page < this.pagination.minPage && this.pagination.minPage != 1) {
      this.getHistories(page, this.queryRequest.page - 1);
    } else {
      this.pagination.currentPage = page;
      this.updateShowingHistoriesData();
    }
  }

  getPageList(): number[] {
    return _.range(this.pagination.minPage, this.pagination.maxPage + 1);
  }

  private updateShowingHistoriesData() {
    const minIndex: number = (this.pagination.currentPage - this.pagination.minPage) * this.pagination.pageSize;
    const maxIndex: number = minIndex + this.pagination.pageSize - 1;

    this.showingHistories = _.filter(this.histories, (item: NewHistory) => {
      return this.histories.indexOf(item) >= minIndex && this.histories.indexOf(item) <= maxIndex;
    });
  }

  play(history: NewHistory) {
    history.gettingMp3Url = true;
    this.historyService
      .getDownloadURL(history.txnUuid, 'mp3')
      .then((data: any) => {
        const portalDownloadURL = data.url;
        const key = portalDownloadURL.substring(portalDownloadURL.lastIndexOf('/') + 1);
        this.fileDownloadService.getDownloadFileUrl(key).subscribe(resp => {
          const file = new Blob([resp.body], { type: `${resp.body.type}` });
          const downloadUrl = URL.createObjectURL(file);

          history.popupContent =
            '<audio src="' +
            downloadUrl +
            '" type="audio/mp3" controls autoplay preload="auto">' +
            'Your browser does not support the <code>audio</code> element.</audio>';
          setTimeout(() => {
            $('#play-' + history.txnUuid)
              .popup({
                on: 'click'
              })
              .popup('show');
          }, 300);
        });

        history.gettingMp3Url = false;
      })
      .catch((err: any) => {
        history.gettingMp3Url = false;
        console.error(err);
        X.showWarn('Can not generate mp3 file.');
      });
  }

  getDownloadLink(history: NewHistory, fileType: string) {
    if (fileType == 'mp3') {
      history.gettingMp3Url = true;
    } else if (fileType == 'txt') {
      history.gettingTxtUrl = true;
    }

    this.historyService
      .getDownloadURL(history.txnUuid, fileType)
      .then((data: any) => {
        window.open(data.url, '_blank');
        history.gettingMp3Url = false;
        history.gettingTxtUrl = false;
      })
      .catch((err: any) => {
        history.gettingMp3Url = false;
        history.gettingTxtUrl = false;
        console.error(err);
        X.showWarn('Can not generate download url.');
      });
  }

  getSftpURL(history: NewHistory) {
    if (!history.monitorS3) {
      X.showWarn('This record is not valid.');
      return;
    }

    history.gettingSftpUrl = true;
    this.historyService
      .getSftpURL(history.txnUuid, history.monitorS3)
      .then((data: any) => {
        if (!data.error) {
          window.open(data.url, '_blank');
        } else if (data.error == 'recordIsNotSyncedYet') {
          X.showWarn('The recording file is being processed. Please try again in 15 minutes.');
          console.error(data.error);
        } else {
          X.showWarn('Can not generate sftp url.');
          console.error(data.error);
        }
        history.gettingSftpUrl = false;
      })
      .catch((err: any) => {
        history.gettingSftpUrl = false;
        console.error(err);
        X.showWarn('Can not generate sftp url.');
      });
  }

  showExportConfig() {
    if (!this.validateDateRange()) {
      X.showWarn('The date range is not valid or exceeds 31 days!');
      return;
    }

    const params: any = {};

    params.app = this.queryRequest.app;
    params.from = this.queryRequest.fromTime;
    params.to = this.queryRequest.toTime + 86400000;
    params.page = 1;
    params.perPage = 100000;

    const message = new ModalMessage(ExportEmailModalComponent, {
      params: params,
      user: this.user
    });
    this.modalService.load(message);
    event.preventDefault();
  }

  showBackupConfig() {
    const message = new ModalMessage(BackupConfigModalComponent, {});
    this.modalService.load(message);
    event.preventDefault();
  }

  private validateDateRange() {
    try {
      const range = this.queryRequest.toTime - this.queryRequest.fromTime;
      return range >= 0 && range <= 86400000 * 30;
    } catch (e) {
      X.showWarn('Date range you are searching is not valid.');
      return null;
    }
  }
}

export class NewHistory {
  constructor(
    public txnUuid?: string,
    public orgUuid?: string,
    public app?: string,
    public callerId?: string,
    public callType?: string,
    public dest?: string,
    public startTime?: Date,
    public endTime?: Date,
    public sourceType?: string,
    public monitorUrl?: string,
    public subscription?: string,
    public extra?: any,
    public popupContent?: any,
    public monitorS3?: any,
    public gettingSftpUrl: boolean = false,
    public gettingMp3Url: boolean = false,
    public gettingTxtUrl: boolean = false
  ) {}
}

class LocalPagination {
  constructor(
    public currentPage: number = 1,
    public pageSize: number = 10,
    public minPage: number = 1,
    public maxPage: number = 1,
    public isLastPage: boolean = false
  ) {}
}
