import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Organization, OrganizationQuery, OrganizationService, UpdateCompanyRequest } from '@b3networks/api/auth';
import { MessageConstants, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'pos-update-org-name-dialog',
  templateUrl: './update-org-name-dialog.component.html',
  styleUrls: ['./update-org-name-dialog.component.scss']
})
export class UpdateOrgNameDialogComponent implements OnInit {
  organization: Organization;
  updating: boolean;

  constructor(
    private organizationQuery: OrganizationQuery,
    private orgService: OrganizationService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<UpdateOrgNameDialogComponent>
  ) {}

  ngOnInit(): void {
    this.organizationQuery.selectOrganization(X.orgUuid).subscribe(org => {
      this.organization = org;
    });
  }

  update(name: string) {
    this.updating = true;
    const req = <UpdateCompanyRequest>{
      shortName: name,
      billingInfo: this.organization.billingInfo,
      timezoneUuid: this.organization.timezone,
      orgUuid: this.organization.uuid,
      logoUrl: this.organization.logoUrl,
      name: this.organization.name,
      timeFormat: this.organization.timeFormat
    };
    this.orgService
      .updateCompanyInfo(req)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(
        _ => {
          this.toastService.success('Your request has been successfully submitted and is being processed.');
          this.dialogRef.close();
        },
        error => {
          if (error.code == 'org.InsufficientPrivilege') {
            this.toastService.warning(`You don't have sufficient privileges to perform this action`);
          } else if (error.code == 'auth.invalidOrganizationShortName') {
            this.toastService.warning('Invalid organization name');
          } else {
            this.toastService.warning(MessageConstants.GENERAL_ERROR);
          }
        }
      );
  }
}
