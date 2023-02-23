import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { IdentityProfile, IdentityProfileQuery, OrgLink, OrgLinkQuery, OrgLinkService } from '@b3networks/api/auth';
import { OrgLinkConfig, OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { ConfirmModalComponent } from '../../../common/confirm-modal/confirm-modal.component';
import { PAGIN, PortalConfigService } from '../../portal-config.service';
import { StoreOrgLinkComponent } from '../../store/outbound/store-org-link/store-org-link.component';

declare const $;

@Component({
  selector: 'b3n-org-link',
  templateUrl: './org-link.component.html',
  styleUrls: ['./org-link.component.scss']
})
export class OrgLinkComponent
  extends DestroySubscriberComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input() oRule: OutboundRule;

  @Output() setLoading = new EventEmitter<boolean>();
  @Output() refresh = new EventEmitter<any>();

  @ViewChild(StoreOrgLinkComponent) storeOrgLinkModal: StoreOrgLinkComponent;
  @ViewChild(ConfirmModalComponent) confirmModal: ConfirmModalComponent;

  orgGroupUuids: Set<string> = new Set<string>();
  orgLinks: OrgLink[] = [];
  orgLinkConfigs: OrgLinkConfig[] = [];
  orgLinkConfigsPagin: OrgLinkConfig[] = [];
  orgLinkConfigsFilter: OrgLinkConfig[] = [];
  pagin = { ...PAGIN };

  groupDropdownEl: any;
  filterGroup: string;
  isAdmin: boolean;
  profile: IdentityProfile;
  afterInit: boolean;

  constructor(
    private el: ElementRef,
    private orgLinkService: OrgLinkService,
    private orgLinkQuery: OrgLinkQuery,
    private profileQuery: IdentityProfileQuery,
    private portalConfigService: PortalConfigService,
    private outboundRuleService: OutboundRuleService
  ) {
    super();
  }

  openStoreOrgLinkModal(orgLinkConfig?: OrgLinkConfig) {
    this.portalConfigService.orgLinkConfig$.next(orgLinkConfig);
    this.storeOrgLinkModal.showModal();
  }

  ngAfterViewInit() {
    this.groupDropdownEl = $(this.el.nativeElement).find('.dropdown');
    this.groupDropdownEl.dropdown({
      onChange: (groupUuid: string, _: any, __: any) => {
        this.pagin = { ...PAGIN };

        this.orgLinkConfigsFilter = groupUuid
          ? this.orgLinkConfigs.filter(o => {
              return o.orgGroupUuid === groupUuid;
            })
          : [...this.orgLinkConfigs];

        this.orgLinkConfigsPagin = this.orgLinkConfigsFilter.slice(
          this.pagin.pageStart,
          this.pagin.pageStart + this.pagin.pageSize
        );

        this.refresh.emit();
      }
    });
  }

  override ngOnDestroy() {
    this.groupDropdownEl.remove();
  }

  ngOnChanges() {
    if (this.afterInit) {
      this.getOrgLinkConfigs();
    }

    if (this.groupDropdownEl) {
      this.groupDropdownEl.dropdown('restore defaults');
      this.groupDropdownEl.dropdown('set selected', '');
    }
  }

  ngOnInit(): void {
    this.profileQuery.profile$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(profile => !!profile),
        tap(async profile => {
          this.profile = profile;
          await this.orgLinkService.getGroups(profile.uuid).toPromise();
          this.fetchOrgLinks();
          this.isAdmin = this.profileQuery.currentOrg.isUpperAdmin;
        })
      )
      .subscribe();
  }

  fetchOrgLinks() {
    this.orgLinkQuery
      .selectAll()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(orgLinks => !!orgLinks && !!orgLinks.length),
        tap(orgLinks => {
          this.orgLinks = orgLinks
            .reduce<OrgLink[]>((prev, curr) => {
              const orgLink = cloneDeep(curr);
              orgLink.organizations = orgLink.organizations.filter(
                o => !!o.name && o.uuid !== this.profileQuery.currentOrg.orgUuid
              );
              prev.push(orgLink);

              return prev;
            }, [])
            .filter(o => !!o.organizations?.length);
          this.portalConfigService.orgLinks$.next(this.orgLinks);
          this.portalConfigService.orgLinkConfig$.next(null);
          this.getOrgLinkConfigs();
          this.afterInit = true;
        })
      )
      .subscribe();
  }

  getOrgLinkConfigs() {
    this.orgLinkConfigs = [];
    this.orgLinkConfigsFilter = [];
    this.orgLinkConfigsPagin = [];
    this.orgGroupUuids = new Set<string>();
    this.pagin = { ...PAGIN };

    const orgLinks = this.oRule.orgLinkConfig.orgLinks;
    const keys = Object.keys(orgLinks);

    if (!keys.length) {
      return;
    }

    for (let i = 0; i < keys.length; i++) {
      const groupUuid = orgLinks[keys[i]].groupUuid;
      const orgLinkConfig = new OrgLinkConfig({
        orgUuid: keys[i],
        orgGroupUuid: groupUuid,
        prefix: orgLinks[keys[i]].prefix,
        name: this.orgLinks.find(o => o.uuid === groupUuid).organizations.find(o => o.uuid === keys[i]).name
      });

      this.orgGroupUuids.add(orgLinkConfig.orgGroupUuid);
      this.orgLinkConfigs.push(orgLinkConfig);
    }

    this.orgLinkConfigsFilter = [...this.orgLinkConfigs];
    this.orgLinkConfigsPagin = this.orgLinkConfigsFilter.slice(
      this.pagin.pageStart,
      this.pagin.pageStart + this.pagin.pageSize
    );

    this.refresh.emit();
  }

  removeOlc(targetOrgUuid: string) {
    this.portalConfigService.isChildModalOpen$.next(true);
    this.confirmModal
      .show({
        header: 'Confirm remove',
        message: 'Are you sure to remove this organization link config?'
      })
      .subscribe(res => {
        if (!res) {
          return;
        }

        this.outboundRuleService
          .delOrgLinkConfig(this.oRule.id, targetOrgUuid)
          .subscribe(
            _ => {
              X.showSuccess(`Remove organization link config successfully`);
            },
            err => X.showWarn(err.message)
          )
          .add(() => this.portalConfigService.isStoreOrgLinkSuccess$.next(true));
      })
      .add(() => this.portalConfigService.isChildModalOpen$.next(false));
  }

  page(pageIndex: number) {
    let { pageStart } = this.pagin;
    const { pageSize } = this.pagin;

    if (pageStart === pageIndex - 1) {
      return;
    }

    this.pagin.pageStart = pageStart = pageIndex - 1;
    this.orgLinkConfigsPagin =
      pageStart < 1
        ? this.orgLinkConfigsFilter.slice(0, pageSize)
        : this.orgLinkConfigsFilter.slice(pageStart * pageSize, pageStart * pageSize + pageSize);

    this.refresh.emit();
  }

  copied() {
    X.showSuccess('Copied to clipboard');
  }

  copyFailed() {
    X.showWarn('Copy failed');
  }
}
