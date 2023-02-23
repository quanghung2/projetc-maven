import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Case, CaseMetaData, CaseService, SCMetaDataQuery, User, UserQuery } from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { differenceInDays, startOfDay } from 'date-fns';
import { lastValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'b3n-case-item',
  templateUrl: './case-item.component.html',
  styleUrls: ['./case-item.component.scss']
})
export class CaseITemComponent extends DestroySubscriberComponent implements OnInit {
  @Input() case: Case;

  caseMetaData: CaseMetaData;

  assignee: User;

  get typeName() {
    return this.caseMetaData?.caseTypeList?.find(p => p.id == this.case?.typeId)?.name;
  }

  get severityName() {
    return this.caseMetaData?.caseSeverityList?.find(p => p.id == this.case?.severityId)?.name;
  }

  get overTime() {
    return (
      this.case?.status === 'open' &&
      differenceInDays(startOfDay(new Date()), startOfDay(new Date(this.case?.dueAt))) > 0
    );
  }

  constructor(
    private caseService: CaseService,
    private userQuery: UserQuery,
    private sCMetaDataQuery: SCMetaDataQuery,
    private router: Router,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.sCMetaDataQuery.scMetaData$
      .pipe(
        filter(v => v != null),
        take(1)
      )
      .subscribe(meta => (this.caseMetaData = meta));

    if (this.case?.assignees?.length) {
      this._getAssignee(this.case?.assignees[0]);
    }
  }

  goToCase(e, cases) {
    if (e.which == 2 || (e.which == 1 && event['ctrlKey'])) {
      let href = window.parent.location.href.split('?')[0];
      href = href + `/${cases.orgUuid}/${cases.sid}`;
      window.open(href, '_blank');
    } else {
      this.router.navigate(['cases', cases.orgUuid, cases?.sid]);
    }
  }

  async onSelectedMember(member: User) {
    if (member) {
      await this._unassignMembers();
      await lastValueFrom(
        this.caseService.updateAssignee(
          { id: this.case.id, sid: this.case.sid, ownerOrgUuid: this.case.ownerOrgUuid },
          'add',
          member.uuid
        )
      );
      this.toastr.success('Assigned case');
      this.assignee = member;
    } else {
      await this._unassignMembers();
      this.toastr.success('Unassiged case');
    }
  }

  private async _unassignMembers() {
    if (this.case.assignees) {
      for (const identityUuid of this.case.assignees) {
        await lastValueFrom(
          this.caseService.updateAssignee(
            { id: this.case.id, sid: this.case.sid, ownerOrgUuid: this.case.ownerOrgUuid },
            'remove',
            identityUuid
          )
        );
      }
    }
  }

  private _getAssignee(uuid?: string) {
    if (uuid) {
      this.assignee = this.userQuery.getUserByUuid(uuid);
    } else {
      this.assignee = null;
    }
  }
}
