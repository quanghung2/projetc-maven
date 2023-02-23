import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { OrgLink } from '@b3networks/api/auth';
import { OrgLinkConfig, OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { X } from '@b3networks/shared/common';
import { combineLatest, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { PortalConfigService } from '../../../portal-config.service';

declare const $;

@Component({
  selector: 'b3n-store-org-link',
  templateUrl: './store-org-link.component.html',
  styleUrls: ['./store-org-link.component.scss']
})
export class StoreOrgLinkComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() rule: OutboundRule;

  orgLinkConfig: OrgLinkConfig;
  orgLinks: OrgLink[];
  modalEl: any;
  groupDropdownEl: any;
  orgDropdownEl: any;
  form: UntypedFormGroup;
  currentLink: OrgLink;
  saving: boolean;

  destroy$ = new Subject<boolean>();

  constructor(
    private outboundRuleService: OutboundRuleService,
    private el: ElementRef,
    private portalConfigService: PortalConfigService,
    private fb: UntypedFormBuilder
  ) {}

  refresh() {
    $(window).trigger('resize');
    this.modalEl.modal('refresh');
  }

  showModal() {
    this.portalConfigService.isChildModalOpen$.next(true);
    this.refresh();
    this.modalEl.modal('show');
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.modalEl.remove();
    this.groupDropdownEl.remove();
    this.orgDropdownEl.remove();
  }

  ngAfterViewInit() {
    this.modalEl = $(this.el.nativeElement).find('div.modal');
    this.modalEl.modal({
      allowMultiple: true,
      closable: false,
      autofocus: false,
      onDeny: () => {
        this.portalConfigService.isChildModalOpen$.next(false);
      }
    });
  }

  ngOnInit(): void {
    combineLatest([
      this.portalConfigService.orgLinks$,
      this.portalConfigService.orgLinkConfig$,
      this.portalConfigService.isChildModalOpen$
    ])
      .pipe(
        takeUntil(this.destroy$),
        tap(([orgLinks, orgLinkConfig, isChildModalOpen]) => {
          if (!isChildModalOpen) {
            return;
          }

          this.orgLinks = orgLinks;
          this.orgLinkConfig = orgLinkConfig;

          this.currentLink = this.orgLinkConfig
            ? this.orgLinks.find(o => o.uuid === this.orgLinkConfig.orgGroupUuid)
            : this.orgLinks[0];

          this.initForm(
            this.currentLink.uuid,
            this.orgLinkConfig
              ? this.currentLink.organizations.find(o => o.uuid === this.orgLinkConfig.orgUuid).uuid
              : this.currentLink.organizations[0].uuid
          );

          setTimeout(() => {
            this.initDropdown();
          }, 0);
        })
      )
      .subscribe();
  }

  initDropdown() {
    this.groupDropdownEl = this.modalEl.find('.dropdown.group');
    this.groupDropdownEl.dropdown({
      onChange: (id: string, _: never, __: never) => {
        this.refresh();
      }
    });

    this.orgDropdownEl = this.modalEl.find('.dropdown.org');
    this.orgDropdownEl.dropdown({
      onChange: (id: string, _: never, __: never) => {
        this.refresh();
      }
    });
  }

  initForm(linkUuid: string, orgUuid: string) {
    this.form = this.fb.group({
      prefix: [this.orgLinkConfig ? this.orgLinkConfig.prefix : '', Validators.required],
      linkUuid: [linkUuid, Validators.required],
      targetOrgUuid: [orgUuid, Validators.required]
    });

    setTimeout(() => {
      const groupDropdown = this.modalEl.find('div .dropdown.group');
      const orgDropdown = this.modalEl.find('div .dropdown.org');

      if (this.orgLinkConfig) {
        groupDropdown.addClass('disabled');
        orgDropdown.addClass('disabled');
      } else {
        groupDropdown.removeClass('disabled');
        orgDropdown.removeClass('disabled');
      }
    }, 0);

    this.form.controls['linkUuid'].valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap(value => {
          this.currentLink = this.orgLinks.find(o => o.uuid === value);
          this.form.controls['targetOrgUuid'].setValue(this.currentLink.organizations[0].uuid);
          this.orgDropdownEl.dropdown('set text', this.currentLink.organizations[0].name);
        })
      )
      .subscribe();
  }

  storeOrgLinkConfig() {
    this.saving = true;
    const { prefix, targetOrgUuid, linkUuid } = this.form.controls;

    this.outboundRuleService
      .addOrgLinkConfig(this.rule.id, {
        prefix: prefix.value,
        orgUuid: targetOrgUuid.value,
        orgGroupUuid: linkUuid.value
      } as OrgLinkConfig)
      .subscribe(
        _ => {
          this.portalConfigService.isChildModalOpen$.next(false);
          this.portalConfigService.isStoreOrgLinkSuccess$.next(true);
          this.modalEl.modal('hide');
          X.showSuccess(`${this.orgLinkConfig ? 'Update' : 'Add'} organization link config successfully`);
        },
        err => X.showWarn(err.message)
      )
      .add(() => (this.saving = false));
  }

  get prefix() {
    return this.form?.controls['prefix'];
  }
}
