import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { EventStreamService } from '../../shared';
import { ListManagementService } from '../../shared/service/list-management.service';

declare let jQuery: any;
declare let X: any;

@Component({
  selector: 'export-consent',
  templateUrl: './export-consent.component.html',
  styleUrls: ['./export-consent.component.scss']
})
export class ExportConsentComponent implements OnDestroy {
  loading = true;
  exporting = false;
  email = '';
  subscription: Subscription;

  constructor(private eventStreamService: EventStreamService, private listManagementService: ListManagementService) {
    this.subscription = this.eventStreamService.on('show-export-consent').subscribe(res => {
      this.eventStreamService.trigger('open-modal', 'export-consent-modal');
      this.loading = false;
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  export(e) {
    this.exporting = true;

    this.listManagementService.export(this.email).subscribe(
      res => {
        this.eventStreamService.trigger('list-management:reload');
        this.eventStreamService.trigger('close-modal', 'export-consent-modal');
        this.exporting = false;
        X.showSuccess(`Result will send to ${this.email}`);
      },
      res => {
        this.eventStreamService.trigger('close-modal', 'export-consent-modal');
        this.exporting = false;
        X.showWarn(`Cannot export consent because ${res.message.toLowerCase()}`);
      }
    );
    e.stopPropagation();
  }
}
