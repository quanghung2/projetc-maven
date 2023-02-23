import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import {
  IAMGrantedPermission,
  IamQuery,
  IAMScope,
  IamService,
  IdentityProfileQuery,
  Member,
  OrgMemberQuery,
  OrgMemberService,
  PolicyDocument,
  Team,
  TeamQuery,
  TeamService
} from '@b3networks/api/auth';
import { arraySome, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

export interface Permission {
  service: string;
  description: string;
  actions: PermissionAction[];
}

export interface PermissionAction {
  name: string;
  description: string;
  granted: boolean;
  isDisable?: boolean;
}

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'b3n-permission',
  templateUrl: './permission.component.html',
  styleUrls: ['./permission.component.scss']
})
export class PermissionComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() permissions: Permission[] = [];
  @Input() member: Member;
  @Input() team: Team;
  @Input() type: 'member' | 'team';

  private version: string;

  constructor(
    private profileQuery: IdentityProfileQuery,
    private orgMemberQuery: OrgMemberQuery,
    private orgMemberService: OrgMemberService,
    private teamQuery: TeamQuery,
    private teamService: TeamService,
    private iamQuery: IamQuery,
    private iamService: IamService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    combineLatest([this.iamQuery.select('allPermissions'), this.policyDocument])
      .pipe(
        filter(([iams, memberPolicy]) => iams != null && memberPolicy != null),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(([iams, memberPolicy]) => {
        this.member = this.orgMemberQuery.getActive();
        this.team = this.teamQuery.getActive();
        this.version = memberPolicy.version;
        this.permissions = [];

        const supportedScopes = this.profileQuery.currentOrg?.isPartner
          ? [IAMScope.adminOrganization, IAMScope.organization]
          : [IAMScope.organization];

        iams
          .filter(p => arraySome(p.service.scopes, supportedScopes))
          .forEach(iam => {
            const permission = <Permission>{
              service: iam.service.name,
              description: iam.service.description,
              actions: []
            };
            iam.actions
              .filter(a => arraySome(a.scopes, supportedScopes))
              .forEach(a => {
                const action = <PermissionAction>{
                  name: a.name,
                  description: a.desc
                };
                const policy = memberPolicy?.policies?.find(p => p.isAllowedAction(permission.service, action.name));
                if (policy) {
                  action.granted = true;
                }
                permission.actions.push(action);
              });
            this.permissions.push(permission);
          });
      });
  }

  ngOnInit(): void {
    this.profileQuery.profile$
      .pipe(
        filter(profile => profile != null),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(profile => {
        const profileOrg = profile.organizations.find(org => org.orgUuid === X.orgUuid);
        if (profileOrg && profileOrg?.isUpperAdmin) {
          this.iamService.fetchAllPermissions().subscribe();
        }
      });
  }

  trackBy(index: number) {
    return index;
  }

  permissionChanged(service: string, action: string, event: MatSlideToggleChange) {
    const body = new PolicyDocument(this.type === 'member' ? this.member.policyDocument : this.team.policyDocument);
    if (event.checked) {
      body.policies.push(<IAMGrantedPermission>{
        service: service,
        action: action,
        resources: ['*']
      });
    } else {
      let index = body.policies.findIndex(userPermission => userPermission.isAllowedAction(service, action));
      if (index > -1) {
        const iam = body.policies[index];
        if (iam.isAllowedAllActions) {
          // should replace * to specific list and then remove current action
          const allowedService = this.permissions.find(p => p.service === service);
          const convertedIAMs = allowedService.actions.map(
            a => new IAMGrantedPermission({ service: service, action: a.name, resources: ['*'] })
          );
          body.policies.push(...convertedIAMs);

          //remove * iam
          body.policies.splice(index, 1);

          // find new iam index
          index = body.policies.findIndex(userPermission => userPermission.isAllowedAction(service, action));
        }

        // remove certain iam
        body.policies.splice(index, 1);
      }
    }

    if (this.version) {
      body.version = this.version;
    }

    this.update(body).subscribe(
      policyDocument => {
        this.toastService.success('Permission have been updated successfully');
        this.version = policyDocument.version;
      },
      error => {
        this.toastService.warning(error.message);
      }
    );
  }

  private update(body: PolicyDocument) {
    return this.type === 'member'
      ? this.orgMemberService.updatePolicyDocument(X.orgUuid, this.member.uuid, body)
      : this.teamService.updatePolicyDocument(X.orgUuid, this.team.uuid, body);
  }

  private get policyDocument() {
    if (!this.type) return null;

    return this.type === 'member'
      ? this.orgMemberQuery.selectPolicyDocument(this.member.uuid)
      : this.teamQuery.selectPolicyDocument(this.team.uuid);
  }
}
