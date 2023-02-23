import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format, subYears } from 'date-fns';
import { takeUntil } from 'rxjs/operators';

export enum TypeMapping {
  'call' = 'call-usage',
  'fax' = 'fax-usage',
  'dnc' = 'dnc-usage',
  'sms' = 'sms-usage',
  'payment' = 'payment'
}

@Component({
  selector: 'pou-usage-history',
  templateUrl: './usage-history.component.html',
  styleUrls: ['./usage-history.component.scss']
})
export class UsageHistoryComponent extends DestroySubscriberComponent implements OnInit {
  readonly usageHistoryType: KeyValue<string, string>[] = [
    { key: 'call', value: 'Call' },
    { key: 'fax', value: 'Fax' },
    { key: 'sms', value: 'SMS' },
    { key: 'dnc', value: 'DNC' },
    { key: 'payment', value: 'Payment' }
  ];
  readonly status = ['All', 'Completed', 'Failed'];
  date = new UntypedFormControl(new Date());

  selectedStatus = this.status[0];
  selectedType = this.usageHistoryType[0].key;
  loading: boolean;
  minDate = new Date(2017, 10);
  maxDate = new Date();
  minDatePayment = format(subYears(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ssxxx");
  fromDate: Date;
  toDate: Date;
  profileOrg: ProfileOrg;
  monthChanged: boolean;

  constructor(private identityProfileQuery: IdentityProfileQuery, private toastService: ToastService) {
    super();
  }

  ngOnInit() {
    this.monthChanged = true;
    this.identityProfileQuery
      .select('profile')
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        profile => {
          this.profileOrg = profile.organizations.find(org => org.orgUuid === X.orgUuid);

          if (!this.profileOrg) {
            this.toastService.error('You not belong to this organization anymore.');
          }
        },
        error => this.toastService.error(error.message)
      );
  }

  get filterDate() {
    return format(this.date.value, "yyyy-MM-dd'T'HH:mm:ssxxx");
  }
}
