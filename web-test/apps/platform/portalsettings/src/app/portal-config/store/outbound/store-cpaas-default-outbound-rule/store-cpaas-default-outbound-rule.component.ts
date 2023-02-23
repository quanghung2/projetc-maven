import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { IdentityProfileService } from '@b3networks/api/auth';
import { OutboundRule } from '@b3networks/api/callcenter';
import { Observable } from 'rxjs';
import { PortalConfigService } from '../../../portal-config.service';

declare const $;

enum OutBoundRuleTab {
  DIAL_PLANS = 'dialPlans',
  COUNTRIES_WHITELIST = 'countriesWhitelist',
  ORGANIZATION_LINK = 'organizationLink'
}

@Component({
  selector: 'b3n-store-cpaas-default-outbound-rule',
  templateUrl: './store-cpaas-default-outbound-rule.component.html',
  styleUrls: ['./store-cpaas-default-outbound-rule.component.scss']
})
export class StoreCpaasDefaultOutboundRuleComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() oRule: OutboundRule;

  @ViewChild('tabs', { static: true }) tabs: ElementRef;
  @ViewChild('dialPlans') dialPlans: TemplateRef<any>;
  @ViewChild('countriesWhitelist') countriesWhitelist: TemplateRef<any>;
  @ViewChild('organizationLink') organizationLink: TemplateRef<any>;

  modalEl: any;

  loading = true;
  activeTab = 0;
  dataTabs = [
    { key: OutBoundRuleTab.DIAL_PLANS, value: 'Dial Plans' },
    { key: OutBoundRuleTab.COUNTRIES_WHITELIST, value: 'Countries Whitelist' }

    //? Hide org link
    // { key: OutBoundRuleTab.ORGANIZATION_LINK, value: 'Organization Link' }
  ];

  isChildModalOpen$: Observable<boolean>;

  constructor(
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
    private portalConfigService: PortalConfigService,
    private identityProfileService: IdentityProfileService
  ) {}

  ngOnDestroy() {
    this.modalEl.remove();
  }

  ngOnInit(): void {
    this.isChildModalOpen$ = this.portalConfigService.isChildModalOpen$;
    this.identityProfileService.getProfile().subscribe();
  }

  ngAfterViewInit() {
    this.modalEl = $(this.el.nativeElement).find('#outbound');
    this.modalEl.modal({
      closable: false,
      autofocus: false
    });

    this.cdr.detectChanges();
  }

  tab(i: number) {
    this.activeTab = i;
    this.refresh();
  }

  showModal() {
    this.modalEl.modal('show');
    this.refresh();
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  refresh() {
    $(window).trigger('resize');
    this.modalEl.modal('refresh');
  }
}
