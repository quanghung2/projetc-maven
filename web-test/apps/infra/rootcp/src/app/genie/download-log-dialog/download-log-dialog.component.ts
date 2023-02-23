import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { AppLogsService } from '@b3networks/api/gatekeeper';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-download-log-dialog',
  templateUrl: './download-log-dialog.component.html',
  styleUrls: ['./download-log-dialog.component.scss']
})
export class DownloadLogDialogComponent implements OnInit {
  keyCtrl = new UntypedFormControl('', Validators.required);
  downloading: boolean;

  constructor(
    private dialogRef: MatDialogRef<DownloadLogDialogComponent>,
    private appLogsService: AppLogsService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  download() {
    if (this.keyCtrl.valid) {
      this.downloading = true;
      this.appLogsService
        .getLogs({ key: this.keyCtrl.value })
        .pipe(finalize(() => (this.downloading = false)))
        .subscribe(
          res => {
            window.open(res.url);
            this.dialogRef.close();
          },
          err => this.toastService.error(err)
        );
    }
  }
}
