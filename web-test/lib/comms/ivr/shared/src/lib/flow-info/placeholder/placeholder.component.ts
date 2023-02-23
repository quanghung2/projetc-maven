import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PlaceholderSettingsResponse, SettingsService } from '@b3networks/api/ivr';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-placeholder',
  templateUrl: './placeholder.component.html',
  styleUrls: ['./placeholder.component.scss']
})
export class PlaceholderComponent implements OnInit {
  workflowUuid: string;
  placeholderSettings: PlaceholderSettingsResponse;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private spinner: LoadingSpinnerSerivce,
    private settingService: SettingsService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<PlaceholderComponent>
  ) {
    this.workflowUuid = data.workflowUuid;
  }

  ngOnInit() {
    this.spinner.showSpinner();
    this.settingService
      .fetchPlaceholderSettings(this.workflowUuid)
      .pipe(finalize(() => this.spinner.hideSpinner()))
      .subscribe(
        (data: PlaceholderSettingsResponse) => (this.placeholderSettings = data),
        err => this.toastService.error(`Cannot fetch settings. Please try again later`)
      );
  }

  close() {
    this.dialogRef.close();
  }
}
