import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  IAMMember,
  IAMGrantedPermission,
  IamService,
  OrgMemberQuery,
  OrgMemberService,
  PolicyDocument
} from '@b3networks/api/auth';
import { Permission } from '@b3networks/portal/shared';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-permission-detail',
  templateUrl: './permission-detail.component.html',
  styleUrls: ['./permission-detail.component.scss']
})
export class PermissionDetailComponent implements OnInit, OnChanges {
  @Input() member: IAMMember;
  @Input() memberUuid: string;
  @Input() allPermissions: IAMGrantedPermission[];

  @Output() closeSidebarEvent = new EventEmitter<boolean>();
  @Output() permissionChangeEvent = new EventEmitter();

  permissions: Permission[] = [];
  version: string;
  progressing: boolean;

  constructor(
    private iamService: IamService,
    private toastService: ToastService,
    private orgMemberService: OrgMemberService,
    private orgMemberQuery: OrgMemberQuery
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (this.member) {
      this.permissions = [];

      this.allPermissions.reduce((acc, item) => {
        const index = this.permissions.findIndex(p => p.service === item.service);
        const granted =
          this.member.iamPolicy?.policies?.some(p => p.service === item.service && item.action === p.action) ||
          this.member.isUpperAdmin;

        if (index === -1) {
          let permission = {
            service: item.service,
            description: item.service,
            actions: [
              { name: item.action, description: item.action?.replace(/([A-Z])/g, ' $1').trim(), granted: granted }
            ]
          } as Permission;
          this.permissions.push(permission);
        } else {
          this.permissions[index].actions = this.permissions[index].actions.concat({
            granted: granted,
            name: item.action,
            description: item.action?.replace(/([A-Z])/g, ' $1').trim()
          });
        }
        return acc;
      }, []);
      this.orgMemberQuery.selectPolicyDocument(this.member.uuid).subscribe(memberPolicy => {
        this.version = memberPolicy?.version;
      });
    }
  }

  trackBy(index: number) {
    return index;
  }

  close() {
    this.closeSidebarEvent.emit(true);
  }

  save() {
    this.progressing = true;
    const policies = [];
    this.permissions.forEach(p => {
      p.actions.forEach(a => {
        if (a.granted) {
          const action = new IAMGrantedPermission({ action: a.name, service: p.service, resources: ['*'] });
          policies.push(action);
        }
      });
    });
    const body = { ...new PolicyDocument(this.member.iamPolicy), policies: policies } as PolicyDocument;
    if (this.version) {
      body.version = this.version;
    }

    this.update(body)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        policyDocument => {
          this.toastService.success('Permission have been updated successfully');
          this.version = policyDocument.version;
          this.permissionChangeEvent.emit();
          this.closeSidebarEvent.emit();
        },
        error => {
          this.toastService.warning(error.message);
        }
      );
  }
  @HostListener('click', ['$event']) click(e) {
    e.stopPropagation();
  }

  private update(body: PolicyDocument) {
    return this.orgMemberService.updatePolicyDocument(X.orgUuid, this.member.uuid, body);
  }
}
