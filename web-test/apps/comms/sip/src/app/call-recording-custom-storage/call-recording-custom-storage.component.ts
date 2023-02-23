import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventStreamService } from '../shared';

declare var X: any;

@Component({
  selector: 'call-recording-custom-storage',
  templateUrl: './call-recording-custom-storage.component.html',
  styleUrls: ['./call-recording-custom-storage.component.scss']
})
export class CallRecordingCustomStorageComponent {
  loading = true;
  isSaving = false;
  settings: any = {
    ftpConfig: {},
    awsConfig: {},
    postbackRecordedUrl: ''
  };

  constructor(private http: HttpClient, private eventStreamService: EventStreamService) {
    this.eventStreamService.on('open-modal').subscribe(res => {
      if (res === 'call-recording-custom-storage-modal') {
        this.loadInfo();
      }
    });
  }

  loadInfo() {
    this.loading = true;
    forkJoin([
      this.http.get<any>(environment.settings.crApiUrl + '/private/v2/compliance/organization'),
      this.http.get<any>(environment.settings.crApiUrl + '/private/v2/compliance/organization/aws')
    ]).subscribe(
      ([res0, res1]) => {
        this.settings.ftpConfig = res0.ftpConfig || {};
        this.settings.awsConfig = res1.awsConfig || {};
        this.settings.postbackRecordedUrl = res0.postbackRecordedUrl || '';
        this.loading = false;
      },
      err => {
        X.showWarn('Cannot load custom storage config.');
        this.loading = false;
      }
    );
  }

  save() {
    this.isSaving = true;
    forkJoin([
      this.http.put(environment.settings.crApiUrl + '/private/v2/compliance/organization', this.settings),
      this.http.put(environment.settings.crApiUrl + '/private/v2/compliance/organization/aws', this.settings)
    ]).subscribe(
      res => {
        this.isSaving = false;
        this.eventStreamService.trigger('close-modal', 'call-recording-custom-storage-modal');
        X.showSuccess('Your setting has been updated successfully.');
      },
      err => {
        X.showWarn('Cannot update custom storage config.');
      }
    );
  }
}
