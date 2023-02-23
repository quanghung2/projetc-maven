import { Component, OnInit } from '@angular/core';
import {
  CrmField,
  CrmHeaderField,
  CrmIntegration,
  OrgConfig,
  OrgConfigQuery,
  OrgConfigService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { of } from 'rxjs';
import { catchError, finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-crm-integration',
  templateUrl: './crm-integration.component.html',
  styleUrls: ['./crm-integration.component.scss']
})
export class CrmIntegrationComponent extends DestroySubscriberComponent implements OnInit {
  crmIntegration: CrmIntegration;

  progressing: boolean;

  constructor(
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private toastService: ToastService,
    private spinner: LoadingSpinnerSerivce
  ) {
    super();
  }

  ngOnInit() {
    this.orgConfigQuery.orgConfig$.pipe(takeUntil(this.destroySubscriber$)).subscribe(config => {
      this.crmIntegration = new CrmIntegration(config.crmIntegration);
    });

    this.orgConfigQuery.selectLoading().subscribe(loading => {
      loading ? this.spinner.showSpinner() : this.spinner.hideSpinner();
    });

    this.orgConfigService
      .getConfig()
      .pipe(
        catchError(error => {
          this.toastService.error(error.message);
          return of(new OrgConfig());
        }),
        finalize(() => this.spinner.hideSpinner())
      )
      .subscribe();
  }

  addMoreHeader() {
    this.crmIntegration.headerFields.push(new CrmHeaderField());
  }

  addMoreField() {
    this.crmIntegration.fields.push(new CrmField());
  }

  update() {
    this.progressing = true;
    const orgConfig = new OrgConfig();
    orgConfig.crmIntegration = this.crmIntegration;
    this.orgConfigService
      .updateConfig(orgConfig)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastService.success('CRM integration has been updated. This update will take effect after 5 minutes.');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
