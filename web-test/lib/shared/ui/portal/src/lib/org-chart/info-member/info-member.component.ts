import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Member, OrgMemberQuery, OrgMemberService } from '@b3networks/api/auth';
import { DirectoryMember } from '@b3networks/api/directory';
import { DestroySubscriberComponent } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-info-member',
  templateUrl: './info-menber.component.html',
  styleUrls: ['./info-member.component.scss']
})
export class InfoMemberComponent extends DestroySubscriberComponent implements OnInit {
  memberInfo: Member & { photoUrl: string | null };
  isLoading: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { member: DirectoryMember },
    private orgMemberService: OrgMemberService,
    private orgMemberQuery: OrgMemberQuery
  ) {
    super();
  }

  private async _getMember(orgUuid: string, memberUuid: string) {
    return await this.orgMemberService.getMember(orgUuid, memberUuid).toPromise();
  }

  async ngOnInit() {
    this.isLoading = true;
    const { memberUuid, orgUuid } = this.data.member;
    if (!this.orgMemberQuery.getHasCache() || !this.orgMemberQuery.getMember(memberUuid))
      await this._getMember(orgUuid, memberUuid);
    this.memberInfo = this.orgMemberQuery.getMember(memberUuid);
    this.isLoading = false;
  }
}
