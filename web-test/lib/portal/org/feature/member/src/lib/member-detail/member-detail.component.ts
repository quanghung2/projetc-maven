import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  IamService,
  IdentityProfile,
  IdentityProfileQuery,
  Member,
  OrgMemberQuery,
  OrgMemberService,
  ProfileOrg
} from '@b3networks/api/auth';
import { PortalConfigQuery } from '@b3networks/api/partner';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { IAMGroupUI } from '../members/members.component';

export interface MemberDetailData {
  member: Member;
  profile: IdentityProfile;
  org: ProfileOrg;
  allowImport: boolean;
  isNewLicense: boolean;
}

@Component({
  selector: 'pom-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss']
})
export class MemberDetailComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  readonly displayedColumns: string[] = ['uuid', 'name', 'action'];

  data$: Observable<MemberDetailData>;
  selectIndexTab = 0;

  @Input() groups: IAMGroupUI[];
  @Output() memberDetailChanged = new EventEmitter<boolean>();
  @Output() closeRightSidenav = new EventEmitter();

  constructor(
    private profileQuery: IdentityProfileQuery,
    private orgMemberQuery: OrgMemberQuery,
    private orgMemberService: OrgMemberService,
    private portalConfigQuery: PortalConfigQuery,
    private iamService: IamService
  ) {
    super();
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groups'] && this.groups.length > 0) {
      this.orgMemberQuery
        .selectActiveId()
        .pipe(
          filter(id => id != null),
          switchMap(id => this.iamService.getIAMGroupMember(X.orgUuid, id as string)),
          takeUntil(this.destroySubscriber$)
        )
        .subscribe(groupsMember => {
          this.groups = this.groups.map(item => <IAMGroupUI>{ ...item, isPermission: false });
          this.groups.forEach(item => {
            const find = groupsMember.find(x => x.uuid === item.uuid);
            if (find) {
              item.isPermission = true;
            }
          });
        });
    }
  }

  ngOnInit() {
    this.data$ = combineLatest([
      this.orgMemberQuery.selectActiveId().pipe(
        distinctUntilChanged(),
        filter(uuid => !!uuid),
        map(uuid => uuid as string),
        tap(memberUuid => this.handleMemberChanged(memberUuid))
      ),
      this.profileQuery.profile$,
      this.profileQuery.currentOrg$,
      this.portalConfigQuery.portalConfig$,
      this.orgMemberQuery.selectActive()
    ]).pipe(
      filter(([member, org, config]) => member != null && org != null && config != null),
      map(
        ([_, profile, org, config, member]) =>
          <MemberDetailData>{
            profile: profile,
            org: org,
            member: member,
            allowImport: config.allowMemberImport
          }
      )
    );
  }

  closeSidenav() {
    this.closeRightSidenav.emit(true);
  }

  change() {
    this.memberDetailChanged.emit(true);
  }

  private handleMemberChanged(memberUuid: string) {
    this.orgMemberService.getPolicyDocument(X.orgUuid, memberUuid).subscribe();
  }
}
