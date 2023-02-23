import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MsTeamCallCenterService, TeamExtension, TeamExtensionReq } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  ConfirmLinkDialogComponent,
  ConfirmLinkDialogData
} from '../confirm-link-dialog/confirm-link-dialog.component';

export interface LinkMsAccountDialogData {
  defaultKey: string;
  defaultUser: string;
}

@Component({
  selector: 'b3n-link-ms-account-dialog',
  templateUrl: './link-ms-account-dialog.component.html',
  styleUrls: ['./link-ms-account-dialog.component.scss']
})
export class LinkMsAccountDialogComponent extends DestroySubscriberComponent implements OnInit {
  errorMessage: string;
  assignedExtensions: TeamExtension[];
  isLoading: boolean;
  extensionControl = new UntypedFormControl();
  userControl = new UntypedFormControl('', [Validators.required, Validators.email]);

  constructor(
    private msTeamCallCenterService: MsTeamCallCenterService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<LinkMsAccountDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LinkMsAccountDialogData
  ) {
    super();
  }

  ngOnInit(): void {
    this.extensionControl.setValue(this.data.defaultKey);
    this.userControl.setValue(this.data.defaultUser);
  }

  handleUpdateExtension() {
    // the mapping is 1-1 relationship
    if (this.userControl.value !== this.data.defaultUser) {
      this.openConfirmModal();
    } else {
      this.closeModal();
    }
  }

  private openConfirmModal() {
    const dialogRef = this.dialog.open(ConfirmLinkDialogComponent, {
      width: '450px',
      data: <ConfirmLinkDialogData>{
        user: this.userControl.value,
        extension: this.data.defaultKey
      }
    });
    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.updateExtension(this.data.defaultKey, this.userControl.value);
      }
    });
  }

  get isExtensionKey(): boolean {
    return this.data.defaultKey.length <= 5;
  }

  updateExtension(key: string, user: string) {
    this.isLoading = true;
    const body: TeamExtensionReq = {
      msTeamUsername: user
    };
    if (this.isExtensionKey) {
      body.extKey = key;
    } else {
      body.ddi = [key];
    }

    this.msTeamCallCenterService
      .updateExtension(body)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(
        () => {
          this.errorMessage = '';
          this.closeModal(true);
        },
        err => {
          this.errorMessage = err.message ? err.message : err;
        }
      );
  }

  private closeModal(isUpdate?: boolean) {
    this.dialogRef.close(isUpdate);
  }
}
