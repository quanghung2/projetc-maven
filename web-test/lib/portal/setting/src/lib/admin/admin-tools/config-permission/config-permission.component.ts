import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  IAMGrantedPermission,
  IAM_AUTH_ACTIONS,
  IAM_SERVICES,
  OrgLinkMember,
  OrgMemberService,
  PolicyDocument
} from '@b3networks/api/auth';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
export interface PermissionDialogInput {
  memberUuid: string;
  policy: PolicyDocument;
  orgLinks: OrgLinkMember[];
}
export interface ViewOrgLink {
  key: OrgLinkMember;
  value: boolean;
}
@Component({
  selector: 'b3n-config-permission',
  templateUrl: './config-permission.component.html',
  styleUrls: ['./config-permission.component.scss']
})
export class ConfigPermissionComponent implements OnInit {
  viewOrgLinks: ViewOrgLink[] = [];
  policy: PolicyDocument;

  constructor(
    private orgMemberService: OrgMemberService,
    private dialogRef: MatDialogRef<ConfigPermissionComponent>,
    private toastr: ToastService,
    @Inject(MAT_DIALOG_DATA) public data: PermissionDialogInput
  ) {}

  ngOnInit(): void {
    this.policy = this.data.policy;
    const iamIndex = this.policy.policies.findIndex(
      p => p.isService(IAM_SERVICES.auth) && p.hasAction(IAM_AUTH_ACTIONS.view_organization_group_member)
    );
    if (iamIndex > -1) {
      this.data.orgLinks.forEach(o => {
        this.viewOrgLinks.push({
          key: o,
          value: this.policy.policies[iamIndex].resources.some(u => o.uuid === u)
        });
      });
    } else {
      this.data.orgLinks.forEach(o => {
        this.viewOrgLinks.push({ key: o, value: false });
      });
    }
  }
  updateViewOrg(orgLink: ViewOrgLink) {
    if (orgLink.value) {
      const body = {
        service: IAM_SERVICES.auth,
        action: IAM_AUTH_ACTIONS.view_organization_group_member,
        resources: [orgLink.key.uuid]
      } as IAMGrantedPermission;
      this.orgMemberService.appendViewOrganization(X.orgUuid, this.data.memberUuid, body).subscribe(
        res => {
          this.policy = res;
          this.toastr.success('Update successfully');
        },
        err => {
          this.toastr.error(err.message);
        }
      );
    } else {
      const body = {
        service: IAM_SERVICES.auth,
        action: IAM_AUTH_ACTIONS.view_organization_group_member,
        resources: [orgLink.key.uuid]
      } as IAMGrantedPermission;
      this.orgMemberService.removeViewOrganization(X.orgUuid, this.data.memberUuid, body).subscribe(
        res => {
          this.policy = res;
          this.toastr.success('Update successfully');
        },
        err => {
          this.toastr.error(err.message);
        }
      );
    }
  }
  close() {
    this.dialogRef.close(this.policy);
  }
}
