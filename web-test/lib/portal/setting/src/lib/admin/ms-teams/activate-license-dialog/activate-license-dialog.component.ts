import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MsTeamAuthService, Subscription } from '@b3networks/api/auth';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';

export interface ActivateLicenseDialogData {
  subscriptions: Subscription[];
  domain: string;
}
@Component({
  selector: 'b3n-activate-license-dialog',
  templateUrl: './activate-license-dialog.component.html',
  styleUrls: ['./activate-license-dialog.component.scss']
})
export class ActivateLicenseDialogComponent extends DestroySubscriberComponent {
  selectedSKUIds: string;
  errorMessage: boolean;
  isLoading: boolean;

  constructor(
    private msTeamAuthService: MsTeamAuthService,
    private dialogRef: MatDialogRef<ActivateLicenseDialogComponent>,
    private toastService: ToastService,
    @Inject(MAT_DIALOG_DATA) public data: ActivateLicenseDialogData
  ) {
    super();
  }

  assignLicense() {
    this.isLoading = true;
    this.errorMessage = false;
    this.msTeamAuthService
      .assignDomainLicence(this.selectedSKUIds, this.data.domain)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        () => {
          this.toastService.success('Activate subscription successfully.');
          this.dialogRef.close();
        },
        _ => {
          this.errorMessage = true;
        }
      );
  }
}
