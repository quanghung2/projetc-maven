import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { ProfileOrg } from '@b3networks/api/auth';
import { SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, filter, tap } from 'rxjs/operators';

enum OrgType {
  memberOrg,
  servicedOrg
}

@Component({
  selector: 'b3n-settings-switch',
  templateUrl: './settings-switch.component.html',
  styleUrls: ['./settings-switch.component.scss']
})
export class SettingsSwitchComponent implements OnInit {
  readonly OrgType = OrgType;

  organizations: ProfileOrg[];
  hasServicedOrg$: Observable<boolean>;
  filterFG = this.fb.group({
    type: this.fb.control(OrgType.memberOrg),
    queryString: this.fb.control(null)
  });
  shouldShowSearchBox: boolean;
  selectedOrgUuid: string;
  enabledLicenseOnly: boolean;

  constructor(
    public dialogRef: MatDialogRef<SettingsSwitchComponent>,
    private toastService: ToastService,
    private sessionQuery: SessionQuery,
    private sessionService: SessionService,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(
        filter(params => !!params),
        tap(params => {
          this.enabledLicenseOnly = params['enabledLicenseOnly'] ? params['enabledLicenseOnly'] === 'true' : false;
          this.organizations = this.enabledLicenseOnly
            ? this.sessionQuery.searchOrgs().filter(o => o.licenseEnabled)
            : this.sessionQuery.searchOrgs();
        })
      )
      .subscribe();

    this.selectedOrgUuid = this.sessionQuery.currentOrg.orgUuid;
    this.hasServicedOrg$ = this.sessionQuery.hasServicedOrg$;
    this.shouldShowSearchBox = this.organizations.length >= 5;

    this.filterFG.get('type').valueChanges.subscribe(orgType => {
      this.filterFG.get('queryString').setValue('');
      this.organizations =
        orgType === OrgType.memberOrg ? this.sessionQuery.searchOrgs() : this.sessionQuery.searchServicedOrgs();
      this.shouldShowSearchBox = this.organizations.length >= 5;

      if (this.enabledLicenseOnly) {
        this.organizations = this.organizations.filter(o => o.licenseEnabled);
      }
    });

    this.filterFG
      .get('queryString')
      .valueChanges.pipe(debounceTime(200))
      .subscribe(queryString => {
        const orgType = this.filterFG.get('type').value;

        this.organizations =
          orgType === OrgType.memberOrg
            ? this.sessionQuery.searchOrgs(queryString)
            : this.sessionQuery.searchServicedOrgs(queryString);

        if (this.enabledLicenseOnly) {
          this.organizations = this.organizations.filter(o => o.licenseEnabled);
        }
      });
  }

  switchOrg(org: ProfileOrg) {
    this.sessionService.switchOrg(org);
    this.toastService.success(`You have switched to ${org.orgName}`);
    this.dialogRef.close(org.orgUuid);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  trackBy(i: number, org: ProfileOrg) {
    return org && org.orgUuid;
  }
}
