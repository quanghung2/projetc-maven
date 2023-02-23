import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  IAMMember,
  IAMGrantedPermission,
  OrgMemberQuery,
  OrgMemberService,
  PolicyDocument
} from '@b3networks/api/auth';
import { Permission, PermissionAction } from '@b3networks/portal/shared';
import { FILE_EXPLORER, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import * as _ from 'lodash';
import { finalize } from 'rxjs';

@Component({
  selector: 'b3n-permissions-detail',
  templateUrl: './permissions-detail.component.html',
  styleUrls: ['./permissions-detail.component.scss']
})
export class PermissionsDetailComponent implements OnInit, OnChanges {
  @Input() member: IAMMember;
  @Input() groupName: string;
  @Input() permissionsIAM: IAMGrantedPermission[];
  @Output() closeSidebarEvent = new EventEmitter<boolean>();
  @Output() permissionChangeEvent = new EventEmitter();

  permissions: Permission[] = [];
  version: string;
  progressing: boolean;
  isFileExplorer: boolean;

  constructor(
    private orgMemberService: OrgMemberService,
    private toastService: ToastService,
    private orgMemberQuery: OrgMemberQuery
  ) {}

  ngOnInit(): void {
    this.isFileExplorer = this.groupName === FILE_EXPLORER;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.member) {
      this.permissions = this.mapPermissions(this.permissionsIAM, this.member);
    }

    this.orgMemberQuery.selectPolicyDocument(this.member?.uuid).subscribe(memberPolicy => {
      this.version = memberPolicy?.version;
    });
  }

  trackBy(index: number): number {
    return index;
  }

  onClose() {
    this.closeSidebarEvent.emit(true);
    this.permissions = this.mapPermissions(this.permissionsIAM, this.member);
  }

  onSave() {
    let req = new PolicyDocument(this.member.iamPolicy);

    this.progressing = true;
    this.permissions?.forEach(p => {
      p.actions?.forEach(a => {
        if (a.granted) {
          const action = new IAMGrantedPermission({
            action: a.name,
            service: p.service,
            resources: ['*']
          });
          !req.policies.some(item => item.id === action.id) && req.policies.push(action);
        } else {
          req = this.handlePermissionUnchecked(req, p, a);
        }
      });
    });

    if (this.version) {
      req.version = this.version;
    }

    this.orgMemberService
      .updatePolicyDocument(X.orgUuid, this.member.uuid, req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        policyDocument => {
          this.toastService.success('Permissions have been updated successfully');
          this.version = policyDocument.version;
          this.permissionChangeEvent.emit();
          this.closeSidebarEvent.emit();
        },
        error => {
          this.toastService.warning(error.message);
        }
      );
  }

  handleCheckBoxFileExplorer(isCheck: boolean, action: PermissionAction) {
    if (action.description !== 'Manage') {
      return;
    }

    this.permissions?.forEach(p => {
      p.actions?.forEach(a => {
        if (a.description === 'View') {
          if (isCheck) {
            a.granted = true;
          }
          a.isDisable = isCheck;
        }
      });
    });
  }

  private mapPermissions(permissionIAM: IAMGrantedPermission[], member: IAMMember): Permission[] {
    return _.chain(permissionIAM)
      .groupBy((x: IAMGrantedPermission) => x.service)
      .map(
        (value: IAMGrantedPermission[], key: string) =>
          ({
            service: key,
            description: key.split('_').join(' '),
            actions: _.map(value, (m: IAMGrantedPermission) => {
              return {
                description: m.action.replace(/([A-Z])/g, ' $1').trim(),
                name: m.action,
                granted:
                  member?.iamPolicy?.policies?.map(v => v.action).includes(m.action) ||
                  member.isUpperAdmin ||
                  (this.isFileExplorer && this.checkgrantedViewFileExplorer(member, m.action)),
                isDisable:
                  member.isUpperAdmin || (this.isFileExplorer && this.checkgrantedViewFileExplorer(member, m.action))
              } as PermissionAction;
            })
          } as Permission)
      )
      .value();
  }

  private handlePermissionUnchecked(
    req: PolicyDocument,
    permission: Permission,
    action: PermissionAction
  ): PolicyDocument {
    let index = req.policies?.findIndex(userPermission =>
      userPermission.isAllowedAction(permission.service, action.name)
    );
    if (index > -1) {
      const iam = req.policies[index];
      if (iam.isAllowedAllActions) {
        // should replace * to specific list and then remove current action
        const allowedService = this.permissions?.find(p => p.service === p.service);
        const convertedIAMs = allowedService?.actions?.map(
          a => new IAMGrantedPermission({ service: permission.service, action: a.name, resources: ['*'] })
        );
        req.policies.push(...convertedIAMs);

        //remove * iam
        req.policies.splice(index, 1);

        // find new iam index
        index = req.policies?.findIndex(userPermission =>
          userPermission.isAllowedAction(permission.service, action.name)
        );
      }

      // remove certain iam
      req.policies?.splice(index, 1);
    }

    return req;
  }

  // Handle permission File Explorer
  private checkgrantedViewFileExplorer(member: IAMMember, action: string): boolean {
    const actionExplorer = member.iamPolicy.policies.map(p => p.service === FILE_EXPLORER && p.action);

    if (action === 'View' && actionExplorer.includes('Manage')) {
      return true;
    }

    return false;
  }
}
