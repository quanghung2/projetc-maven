import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { TimerCall } from '@b3networks/api/call';
import { S3Service, ScaningStatus } from '@b3networks/api/file';
import { format, subDays } from 'date-fns';
import { environment } from '../../environments/environment';
import { CacheService, PhoneNumberService } from '../shared';

declare let jQuery: any;
declare let X: any;

@Component({
  selector: 'check-number',
  templateUrl: './check-number.component.html',
  styleUrls: ['./check-number.component.scss']
})
export class CheckNumberComponent {
  loading = true;
  proceeding = false;
  lookingupRate = false;
  searching = false;
  tempKey = '';
  proceeded = false;
  uploading = false;
  price: any = {};
  countSingaporeNumber = -1;
  countNumber = 0;
  lastDay = '1';
  searchRequest: any = {
    from: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  };
  pagination: any = {
    currentPage: 1,
    perPage: 10
  };
  searchResult: any = {
    totalCount: 0,
    entries: []
  };
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private s3Service: S3Service,
    private phoneNumberService: PhoneNumberService
  ) {
    this.price = this.cacheService.get('price-info');
    if (!this.price) {
      this.price = {};
    }
    this.search();
  }

  upload(event) {
    if (event.target.files.length > 0) {
      const file: File = event.target.files[0];
      if (!this.isValidFileType(file)) {
        X.showWarn('Invalid file');
        return;
      }
      this.uploading = true;
      const progressBar = jQuery('.ui.progress');
      progressBar.progress({
        percent: 0
      });

      this.s3Service.tempUploadWithAVScan(file).subscribe(
        res => {
          if (res.status === 'processing' || res.status === 'completed') {
            progressBar.progress({ percent: res.percentage });
          }
          if (res.status === 'completed') {
            const timer = new TimerCall();
            timer.countTimeCall();
            this.avScanProgress(res?.scanId, timer, () => {
              this.tempKey = res.tempKey;
              this.proceeded = false;
              this.calculateSingaporeNumber(file);
              this.calculateBilling();
            });
          } else if (res.status === 'canceled') {
            X.showWarn('Update canceled.');
            this.uploading = false;
          }
          this.errorMessage = '';
        },
        () => {
          this.errorMessage = 'Error! Can not upload file';
          this.uploading = false;
        }
      );
    }
  }

  proceed() {
    this.proceeding = true;
    const user = this.cacheService.get('user-info');
    this.http
      .get(`/dnc/api/v2/private/lookup`, {
        params: {
          media: 'voice,fax,sms',
          remarks: 'check from client',
          tempKey: this.tempKey,
          appId: environment.settings.appId,
          emailPostback: user.identity.email,
          checkingMode: 'fetch_all',
          credentialUuid: '',
          credentialType: 'identity'
        }
      })
      .subscribe(
        () => {
          this.proceeding = false;
          this.proceeded = true;
        },
        res => {
          if (res.code.indexOf('reachDNCCheckingLimit') > -1) {
            X.showWarn(
              `We are unable to proceed due to your account DNC Checking Limits. Please contact support to increase your DNC Checking Limits.`
            );
          } else {
            X.showWarn(`Cannot lookup because ${res.message.toLowerCase()}`);
          }
          this.proceeding = false;
        }
      );
  }

  search() {
    this.searching = true;
    this.http
      .get<any>(`/dnc/api/v2/private/logs/_bulkFiltering`, {
        params: {
          from: this.searchRequest.from + ' 00:00:00',
          to: this.searchRequest.to + ' 23:59:59',
          page: this.pagination.currentPage,
          perPage: this.pagination.perPage
        },
        observe: 'response'
      })
      .subscribe(
        res => {
          this.searchResult.totalCount = res.headers.get('x-hoiio-pagination-total-count');
          this.searchResult.entries = res.body.sort((a, b) => b.created_at - a.created_at);
          this.searching = false;
        },
        res => {
          X.showWarn(`Cannot get log because ${res.body.message.toLowerCase()}`);
        }
      );
  }

  clearFile() {
    this.tempKey = '';
  }

  changePage(page) {
    this.pagination.currentPage = page;
    this.search();
  }

  changeFrom(date) {
    this.searchRequest.from = format(date, 'yyyy-MM-dd');
  }

  changeTo(date) {
    this.searchRequest.to = format(date, 'yyyy-MM-dd');
    this.search();
  }

  download(key) {
    this.http
      .get<any>(`/dnc/api/v2/private/urls/preSigned`, {
        params: {
          key: key
        }
      })
      .subscribe(
        res => {
          window.open(res.url);
        },
        res => {
          X.showWarn(`Cannot download file because ${res.message.toLowerCase()}`);
        }
      );
  }

  changeLastDay(lastDay) {
    this.lastDay = lastDay;
    if (Number.isInteger(parseInt(this.lastDay, 10))) {
      this.searchRequest.from = format(subDays(new Date(), parseInt(this.lastDay, 10)), 'yyyy-MM-dd');
      this.searchRequest.to = format(new Date(), 'yyyy-MM-dd');
      this.search();
    }
  }

  calculateSingaporeNumber(file) {
    const reader = new FileReader();
    let countSingaporeNumber = 0;
    let countNumber = 0;
    reader.onload = () => {
      const text = reader.result;
      let numbers = [];
      if (text instanceof String) {
        numbers = text.split('\n');
      }
      const knumbers = this.uniqFast(numbers);
      knumbers.forEach(n => {
        if (n.trim()) {
          countNumber++;
          if (this.phoneNumberService.isSingaporeNumber(n)) {
            countSingaporeNumber++;
          }
        }
      });
      this.countNumber = countNumber;
      this.countSingaporeNumber = countSingaporeNumber;
    };
    reader.readAsText(file);
  }

  calculateBilling() {
    this.lookingupRate = true;
    this.http
      .get<any>(`/dnc/api/v2/private/lookupRate`, {
        params: {
          media: 'voice,fax,sms',
          tempKey: this.tempKey,
          appId: environment.settings.appId,
          credentialUuid: '',
          credentialType: 'identity'
        }
      })
      .subscribe(
        res => {
          this.countSingaporeNumber = res.billing.numberOfDncCheck;
          this.lookingupRate = false;
          this.errorMessage = '';
        },
        res => {
          this.clearFile();
          this.errorMessage = `Cannot lookup rate because ${res.message.toLowerCase()}`;
          this.lookingupRate = false;
        }
      );
  }

  getTotalResult() {
    return this.countSingaporeNumber < 0 ? '-' : Math.round(this.countSingaporeNumber * this.price.real * 1000) / 1000;
  }

  uniqFast(a) {
    const seen = {};
    const out = [];
    const len = a.length;
    let j = 0;
    for (let i = 0; i < len; i++) {
      const item = a[i];
      if (seen[item] !== 1) {
        seen[item] = 1;
        out[j++] = item;
      }
    }
    return out;
  }

  private avScanProgress(scanId: number, timer: TimerCall, callback: () => void) {
    let isFinished = true;
    this.s3Service.scaningFileStatus(scanId).subscribe(
      status => {
        const { failed, infected, scanning } = ScaningStatus;
        switch (status) {
          case failed:
            X.showWarn('High traffic. Please try again later.');
            break;
          case infected:
            X.showWarn('Warning! The upload file has been infected.');
            break;
          case scanning:
            // timeout is less than 5 minutes then execute
            if (timer.second < 300) {
              setTimeout(() => this.avScanProgress(scanId, timer, callback), 1000);
              isFinished = false;
            } else X.showWarn('High traffic. Please try again later.');
            break;
          default:
            callback();
            break;
        }
        if (isFinished) {
          timer.clearIntervalTime();
          this.uploading = false;
        }
      },
      error => {
        X.showWarn(error.message || 'The file could not be uploaded. Please try again in a few minutes');
        this.uploading = false;
      }
    );
  }

  private isValidFileType(file: { name: string; type: string }) {
    return /.*\.csv$/.test(file.name) || file.type === 'text/csv';
  }
}
