import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrgLink } from '@b3networks/api/auth';
import { OrgLinkConfig, OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { tap } from 'rxjs/operators';

export interface StoreOrgLinkInput {
  orgLinkConfig: OrgLinkConfig;
  orgLinks: OrgLink[];
  rule: OutboundRule;
}

@Component({
  selector: 'pos-add-org-link',
  templateUrl: './store-org-link.component.html',
  styleUrls: ['./store-org-link.component.scss']
})
export class StoreOrgLinkComponent implements OnInit {
  form: UntypedFormGroup;
  currentLink: OrgLink;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: StoreOrgLinkInput,
    public dialogRef: MatDialogRef<StoreOrgLinkComponent>,
    private fb: UntypedFormBuilder,
    private outboundRuleService: OutboundRuleService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const { orgLinkConfig, orgLinks } = this.data;

    this.currentLink = orgLinkConfig ? orgLinks.find(o => o.uuid === orgLinkConfig.orgGroupUuid) : orgLinks[0];
    this.initForm(
      this.currentLink.uuid,
      orgLinkConfig
        ? this.currentLink.organizations.find(o => o.uuid === orgLinkConfig.orgUuid).uuid
        : this.currentLink.organizations[0].uuid
    );
  }

  initForm(linkUuid: string, orgUuid: string) {
    this.form = this.fb.group({
      prefix: ['', Validators.required],
      linkUuid: [linkUuid, Validators.required],
      targetOrgUuid: [orgUuid, Validators.required]
    });

    if (this.data.orgLinkConfig) {
      this.form.controls['linkUuid'].disable();
      this.form.controls['targetOrgUuid'].disable();
    }

    this.form.controls['linkUuid'].valueChanges
      .pipe(
        tap(linkUuid => {
          this.currentLink = this.data.orgLinks.find(o => o.uuid === linkUuid);
          this.form.controls['targetOrgUuid'].setValue(this.currentLink.organizations[0].uuid);
        })
      )
      .subscribe();
  }

  configOrgLinkConfig() {
    const { prefix, targetOrgUuid, linkUuid } = this.form.controls;

    this.outboundRuleService
      .addOrgLinkConfig(this.data.rule.id, {
        prefix: prefix.value,
        orgUuid: targetOrgUuid.value,
        orgGroupUuid: linkUuid.value
      } as OrgLinkConfig)
      .subscribe(
        _ => {
          this.toastService.success(
            `${this.data.orgLinkConfig ? 'Update' : 'Add'} organization link config successfully`
          );

          this.dialogRef.close(true);
        },
        err => this.toastService.warning(err.message)
      );
  }
}
