import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProjectQuery } from '@b3networks/api/flow';
import { ConfigurationService, Webhook } from '@b3networks/api/integration';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';
import { UpdateConfigComponent } from './register-webhook/register-webhook.component';

@Component({
  selector: 'b3n-webhook-url',
  templateUrl: './webhook-url.component.html',
  styleUrls: ['./webhook-url.component.scss']
})
export class WebhookUrlComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  webhookConfigs: Webhook[];
  displayedColumns = ['code', 'url', 'actions'];
  subUuid: string;

  constructor(
    private configurationService: ConfigurationService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private projectQuery: ProjectQuery
  ) {
    super();
  }

  ngOnInit() {
    this.loading = true;
    this.fetchWebhooks();
  }

  fetchWebhooks() {
    this.projectQuery.projects$.subscribe(() => {
      this.subUuid = this.projectQuery.getActive()?.subscriptionUuid;
      this.subUuid &&
        this.configurationService
          .fetchWebhooks(this.subUuid)
          .pipe(finalize(() => (this.loading = false)))
          .pipe(takeUntil(this.destroySubscriber$))
          .subscribe(
            configs => {
              this.webhookConfigs = configs;
            },
            error => {
              this.toastService.error(error.message || 'Cannot get webhook configs. Please try again later');
            }
          );
    });
  }

  registerWebhook() {
    this.dialog
      .open(UpdateConfigComponent, {
        width: '500px',
        data: {
          type: 'register'
        }
      })
      .afterClosed()
      .subscribe(result => {
        if (!!result) {
          this.toastService.success('Registered successfully');
          this.fetchWebhooks();
        }
      });
  }

  viewDetail(config: Webhook) {
    this.dialog.open(UpdateConfigComponent, {
      width: '500px',
      data: {
        type: 'view',
        webhook: config
      }
    });
  }

  deleteWebhook(code: string) {
    this.dialog
      .open(ConfirmDialogComponent, {
        autoFocus: false,
        data: {
          title: 'Delete webhook configuration',
          message: 'Are you sure to delete this configuration?',
          confirmLabel: 'Delete',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.configurationService.delete(code, this.subUuid).subscribe(
            _ => {
              this.toastService.success('Deleted successfully');
              this.fetchWebhooks();
            },
            error => {
              this.toastService.error(error.message || 'Cannot delete config. Please try again later.');
            }
          );
        }
      });
  }
}
