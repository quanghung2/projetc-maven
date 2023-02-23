import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ApiKey, ApiKeysService } from '@b3networks/api/auth';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-api-key-management',
  templateUrl: './api-key-management.component.html',
  styleUrls: ['./api-key-management.component.scss']
})
export class ApiKeyManagementComponent extends DestroySubscriberComponent implements OnInit {
  readonly displayedColumns = ['apiKey', 'status', 'createdAt', 'actions'];

  apiKeys: ApiKey[];

  loading = true;
  creating: boolean;

  constructor(private dialog: MatDialog, private toastService: ToastService, private apiKeysService: ApiKeysService) {
    super();
  }

  ngOnInit() {
    this.fetchApiKeys();
  }

  fetchApiKeys() {
    this.loading = true;
    this.apiKeysService
      .fetchAll()
      .pipe(finalize(() => (this.loading = false)))
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        keys => {
          this.apiKeys = keys;
        },
        error => {
          this.toastService.error(error.message || 'Cannot get api keys. Please try again later');
        }
      );
  }
  copied() {
    this.toastService.success('Copied to clipboard!');
  }

  createKey() {
    this.creating = true;
    this.apiKeysService
      .create()
      .pipe(finalize(() => (this.creating = false)))
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        _ => {
          this.toastService.success('Created successfully');
          this.fetchApiKeys();
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  disableKey(key: ApiKey) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '450px',
        data: <ConfirmDialogInput>{
          color: 'warn',
          message:
            'Once you disable this ' +
            key.apiKey.substring(0, 8) +
            ' API Key, You will no longer can make request to Open API with it. Are you sure about this??',
          title: 'Disable API Key'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.apiKeysService.disable(key.apiKey).subscribe(_ => {
            this.toastService.success('Updated successfully');

            this.fetchApiKeys();
          });
        }
      });
  }

  activateKey(key: ApiKey) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '450px',
        data: <ConfirmDialogInput>{
          color: 'primary',
          message: 'Are you sure to activate this key?',
          title: 'Activate API Key'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.apiKeysService.activate(key.apiKey).subscribe(_ => {
            this.toastService.success('Updated successfully');

            this.fetchApiKeys();
          });
        }
      });
  }
}
