import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy } from '@angular/core';
import { TimerCall } from '@b3networks/api/call';
import { S3Service, ScaningStatus } from '@b3networks/api/file';
import { Observable, Subscription } from 'rxjs';
import { EventStreamService, ListManagementService } from '../../shared';

declare let jQuery: any;
declare let X: any;

@Component({
  selector: 'add-consent-number',
  templateUrl: './add-consent-number.component.html',
  styleUrls: ['./add-consent-number.component.scss']
})
export class AddConsentNumberComponent implements OnDestroy {
  loading = true;
  adding = false;
  bulkImport = false;
  tempKey = '';
  uploading = false;
  form: any = {
    number: '',
    voice: 'notRecorded',
    fax: 'notRecorded',
    sms: 'notRecorded'
  };
  subscription: Subscription;

  constructor(
    private http: HttpClient,
    private eventStreamService: EventStreamService,
    private s3Service: S3Service,
    private listManagementService: ListManagementService
  ) {
    this.subscription = this.eventStreamService.on('show-add-consent-number').subscribe(() => {
      this.eventStreamService.trigger('open-modal', 'add-consent-number-modal');
      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  add(e) {
    this.adding = true;
    let obs: Observable<any>;
    if (this.bulkImport) {
      obs = this.listManagementService.import(this.tempKey);
    } else {
      obs = this.listManagementService.add(this.form.number, this.form.voice, this.form.fax, this.form.sms);
    }
    obs.subscribe(
      () => {
        this.eventStreamService.trigger('list-management:reload');
        this.eventStreamService.trigger('close-modal', 'add-consent-number-modal');
        this.adding = false;
        X.showSuccess(`Added consent successfully`);
      },
      res => {
        this.eventStreamService.trigger('close-modal', 'add-consent-number-modal');
        this.adding = false;
        X.showWarn(`Cannot import consent because ${res.message.toLowerCase()}`);
      }
    );
    e.stopPropagation();
  }

  upload(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
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
              X.showSuccess(`Upload successfully`);
            });
          } else if (res.status === 'canceled') {
            X.showWarn('Update canceled.');
            this.uploading = false;
          }
        },
        () => {
          X.showWarn('Error! Can not upload file.');
          this.uploading = false;
        }
      );
    }
  }

  clearFile() {
    this.tempKey = '';
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
