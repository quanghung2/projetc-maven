import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Partner, PartnerQuery, PortalConfig, PortalConfigQuery } from '@b3networks/api/partner';
import { Observable } from 'rxjs';

@Component({
  selector: 'pba-template-auth',
  templateUrl: './template-auth.component.html',
  styleUrls: ['./template-auth.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TemplateAuthComponent implements OnInit {
  partner$: Observable<Partner>;
  config$: Observable<PortalConfig>;

  constructor(private portalConfigQuery: PortalConfigQuery, private partnerQuery: PartnerQuery) {}

  ngOnInit(): void {
    this.partner$ = this.partnerQuery.partner$;
    this.config$ = this.portalConfigQuery.portalConfig$;
  }
}
