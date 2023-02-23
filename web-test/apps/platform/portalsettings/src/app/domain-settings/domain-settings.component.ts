import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { UpdateSenderEmail } from '../core/models/update-sender-email.model';
import { PartnerService, RouteService } from '../core/services';
import { PartnerDomain } from './../core/models/partner.model';

@Component({
  selector: 'app-domain-settings',
  templateUrl: './domain-settings.component.html',
  styleUrls: ['./domain-settings.component.scss']
})
export class DomainSettingsComponent implements OnInit {
  isLoading = true;
  isUpdating = false;

  partner: PartnerDomain;
  private initialPartner: PartnerDomain;
  updateSenderEmailRequest: UpdateSenderEmail;

  constructor(private partnerService: PartnerService, private routeService: RouteService) {}

  ngOnInit() {
    this.routeService.domain
      .pipe(
        switchMap(d => forkJoin([this.partnerService.getDomain(), this.partnerService.getChangeSenderEmailStatus()]))
      )
      .subscribe(res => {
        this.initialPartner = res[0];
        this.partner = new PartnerDomain(res[0]);
        if (!!res[1] && !!res[1].newSenderEmail) {
          this.updateSenderEmailRequest = res[1];
        }
        this.isLoading = false;
      });
  }

  hasChanges() {
    for (const key in this.initialPartner) {
      if (this.initialPartner.hasOwnProperty(key) && this.partner.hasOwnProperty(key)) {
        if (this.initialPartner[key] != this.partner[key]) {
          return true;
        }
      }
    }

    return false;
  }

  save() {
    this.isUpdating = true;
    const body = {
      supportEmail: this.partner.supportEmail
    };

    if (this.partner.salesEmail) {
      body['salesEmail'] = this.partner.salesEmail;
    }
    this.partnerService.updateDomain(body).subscribe(res => {
      this.initialPartner = new PartnerDomain(this.partner);
      this.isUpdating = false;
    });
  }

  reset() {
    this.partner = new PartnerDomain(this.initialPartner);
  }

  senderEmailChange(newSenderEmail) {
    this.partnerService.getChangeSenderEmailStatus().subscribe(res => (this.updateSenderEmailRequest = res));
  }
}
