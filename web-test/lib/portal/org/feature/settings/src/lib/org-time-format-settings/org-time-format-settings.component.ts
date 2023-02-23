import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Organization, OrganizationQuery, OrganizationService, UpdateCompanyRequest } from '@b3networks/api/auth';
import { DestroySubscriberComponent, MessageConstants, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'pos-org-time-format-settings',
  templateUrl: './org-time-format-settings.component.html',
  styleUrls: ['./org-time-format-settings.component.scss']
})
export class OrgTimeFormatSettingsComponent extends DestroySubscriberComponent implements OnInit {
  readonly timeFormatOptions = ['yyyy-MM-dd HH:mm', 'yyyy-MM-dd HH:mm:ss'];
  loading: boolean;
  updating: boolean;

  org: Organization;

  constructor(
    private toastService: ToastService,
    private organizationQuery: OrganizationQuery,
    private organizationService: OrganizationService,
    private dialogRef: MatDialogRef<OrgTimeFormatSettingsComponent>
  ) {
    super();
  }

  ngOnInit(): void {
    this.organizationQuery
      .selectOrganization(X.orgUuid)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(org => {
        this.org = cloneDeep(org);
      });
  }

  update() {
    this.updating = true;
    const req = {
      orgUuid: this.org.uuid,
      timeFormat: this.org.timeFormat,
      billingInfo: this.org.billingInfo,
      logoUrl: this.org.logoUrl,
      name: this.org.name,
      shortName: this.org.shortName,
      timezoneUuid: this.org.timezone
    } as UpdateCompanyRequest;

    this.organizationService
      .updateCompanyInfo(req)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(
        _ => {
          this.toastService.success('Organization information has been updated.');
          this.dialogRef.close();
        },
        error => {
          if (
            'org.organizationShortNameExists'.toLowerCase() == error.code.toLowerCase() ||
            'org.invalidOrganizationShortName' == error.code
          ) {
            this.toastService.warning(error.message);
          } else if ('org.InsufficientPrivilege' == error.code) {
            this.toastService.warning(`You don't have sufficient privileges to perform this action`);
          } else {
            this.toastService.warning(MessageConstants.GENERAL_ERROR);
          }
        }
      );
  }
}
