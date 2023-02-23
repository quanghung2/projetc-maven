import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { LicenseDevService } from '@b3networks/api/license';
import { MatPaginator } from '@angular/material/paginator';
import { ProjectQuery } from '@b3networks/api/flow';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil, tap } from 'rxjs/operators';
import { APIKey, ApiKeyManagementService, ApiKeyQuery, UpdateOrResetApiKeyReq } from '@b3networks/api/integration';
import { StoreApiKeyComponent } from './store-api-key/store-api-key.component';
import { DestroySubscriberComponent } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-api-key-management',
  templateUrl: './api-key-management.component.html',
  styleUrls: ['./api-key-management.component.scss']
})
export class ApiKeyManagementComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  loading: boolean;
  creating: boolean;
  assignedApiKey: APIKey;
  showApiKey = false;

  constructor(
    private dialog: MatDialog,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private licenseDevService: LicenseDevService,
    private projectQuery: ProjectQuery,
    private apiKeyService: ApiKeyManagementService,
    private apiKeyQuery: ApiKeyQuery
  ) {
    super();
  }

  ngOnInit() {
    this.loading = true;
    this.apiKeyQuery
      .select('apiKey')
      .pipe(takeUntil(this.destroySubscriber$))
      .pipe(tap(_ => (this.loading = false)))
      .subscribe(apiKey => {
        this.assignedApiKey = apiKey;
      });
  }

  copied() {
    this.toastService.success('Copied to clipboard!');
  }

  create() {
    const subscriptionUuid = this.projectQuery.getActive()?.subscriptionUuid;
    this.dialog
      .open(StoreApiKeyComponent, {
        width: '400px',
        data: subscriptionUuid
      })
      .afterClosed()
      .subscribe(status => {
        if (status && status.ok) {
          this.apiKeyService.getDeveloperLicenses().subscribe(licenses => {
            const license = licenses?.find(license => license?.subUuid === subscriptionUuid);
            this.getAssignedApiKey(license?.assignedApiKeyId);
          });
        }
      });
  }

  confirmDelete() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          color: 'warn',
          title: 'Delete API Key',
          confirmLabel: 'Delete',
          message: `This action will permanently delete the API Key (<strong>${this.assignedApiKey.apiKey?.slice(
            0,
            30
          )}</strong>). Are sure you?`
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.delete();
        }
      });
  }

  toggleViewApiKey() {
    this.showApiKey = !this.showApiKey;
  }

  confirmReset() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          color: 'warn',
          title: 'Reset API Key',
          confirmLabel: 'Reset',
          message: `The API Key (<strong>${this.assignedApiKey?.apiKey}</strong>) will be invalidated.This action is not recoverable. Are you sure?`
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.reset();
        }
      });
  }

  private getAssignedApiKey(apiKeyId?: number) {
    this.apiKeyService
      .getAssignedApiKey(apiKeyId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(apiKey => {
        this.assignedApiKey = apiKey;
      });
  }

  private delete() {
    this.apiKeyService.deleteApiKey(this.assignedApiKey.id).subscribe(
      _ => {
        this.toastService.success('Deleted successfully');
        this.getAssignedApiKey();
      },
      error => {
        this.toastService.error(error.message);
      }
    );
  }

  private reset() {
    const req = {
      name: null,
      regenApiKey: true
    } as UpdateOrResetApiKeyReq;

    this.apiKeyService.updateOrResetApiKey(this.assignedApiKey.id, req).subscribe(
      _ => {
        this.toastService.success('Reseted successfully');
        this.getAssignedApiKey(this.assignedApiKey.id);
      },
      error => {
        this.toastService.error(error.message);
      }
    );
  }
}
