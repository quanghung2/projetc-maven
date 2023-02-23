import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ProfileOrg } from '@b3networks/api/auth';
import { SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

enum OrgType {
  memberOrg,
  servicedOrg
}

export interface SwitchOrganizationData {
  disabledClose?: boolean;
  activeApp?: string;
}

@Component({
  selector: 'b3n-switch-org',
  templateUrl: './switch-org.component.html',
  styleUrls: ['./switch-org.component.scss']
})
export class SwitchOrganizationDialog implements OnInit {
  organizations: ProfileOrg[];
  hasServicedOrg$: Observable<boolean>;

  filterFG = this.fb.group({
    type: this.fb.control(OrgType.memberOrg),
    queryString: this.fb.control(null)
  });

  shouldShowSearchBox: boolean;
  isServicedOrg: boolean;

  selectedOrgUuid: string;
  readonly OrgType = OrgType;

  constructor(
    public dialogRef: MatDialogRef<SwitchOrganizationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: SwitchOrganizationData,
    private toastService: ToastService,
    private sessionQuery: SessionQuery,
    private sessionService: SessionService,
    private router: Router,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit() {
    this.selectedOrgUuid = this.sessionQuery.currentOrg?.orgUuid;
    this.hasServicedOrg$ = this.sessionQuery.hasServicedOrg$;
    this.organizations = this.sessionQuery.searchOrgs();
    this.shouldShowSearchBox = this.organizations.length >= 5;

    this.filterFG.get('type').valueChanges.subscribe(orgType => {
      this.filterFG.get('queryString').setValue('');

      this.organizations =
        orgType === OrgType.memberOrg ? this.sessionQuery.searchOrgs() : this.sessionQuery.searchServicedOrgs();
      this.shouldShowSearchBox = this.organizations.length >= 5;

      this.isServicedOrg = orgType === OrgType.servicedOrg ? true : false;
    });
    this.filterFG
      .get('queryString')
      .valueChanges.pipe(debounceTime(200))
      .subscribe(queryString => {
        console.log(queryString);
        const orgType = this.filterFG.get('type').value;
        this.organizations =
          orgType === OrgType.memberOrg
            ? this.sessionQuery.searchOrgs(queryString)
            : this.sessionQuery.searchServicedOrgs(queryString);
      });
  }

  switchOrg(org: ProfileOrg) {
    this.sessionService.switchOrg(org);

    // const view = this.appQuery.getLastActiveView(org.orgUuid) || 'home';
    // setTimeout(() => {
    let activeApp = this.data?.activeApp || 'home';
    const params = {};
    if (activeApp.includes('?')) {
      try {
        const paths = activeApp.split('?');
        activeApp = paths[0];

        const urlSearch = new URLSearchParams(paths[1]);
        urlSearch.forEach((value, key) => {
          params[key] = [value];
        });
      } catch (error) {
        // do nothing
      }
    }

    this.router.navigate([org.orgUuid, activeApp], { queryParams: params });
    // }, 1000);

    this.toastService.success(`You have switched to ${org.orgName}`);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  trackBy(i: number, org: ProfileOrg) {
    return org && org.orgUuid;
  }

  orgExisted(org: ProfileOrg) {
    return this.sessionQuery.searchOrgs().some(o => o.orgUuid === org.orgUuid);
  }
}
