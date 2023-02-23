import { Component, OnInit } from '@angular/core';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { BulkFilterService, LogBulkFiltering, LogService, LookupRateReq, UrlService } from '@b3networks/api/dnc';
import { SkuPriceService } from '@b3networks/api/salemodel';
import { APP_IDS, DestroySubscriberComponent, download } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, takeUntil } from 'rxjs/operators';

interface PriceCalculator {
  price: number;
  discount: number;
  currency: string;
  real: number;
}

@Component({
  selector: 'b3n-bulk-filtering',
  templateUrl: './bulk-filtering.component.html',
  styleUrls: ['./bulk-filtering.component.scss']
})
export class BulkFilteringComponent extends DestroySubscriberComponent implements OnInit {
  isLoading: boolean;
  price: PriceCalculator;
  countSingaporeNumber = -1;
  timeZone: string;
  backgroundUploading: boolean;

  get totalResult() {
    return Math.round(this.countSingaporeNumber * this.price.real * 1000) / 1000;
  }

  constructor(
    private identityProfileQuery: IdentityProfileQuery,
    private skuPriceService: SkuPriceService,
    private logService: LogService,
    private urlService: UrlService,
    private toastService: ToastService,
    private bulkFilterService: BulkFilterService
  ) {
    super();
  }

  ngOnInit(): void {
    this.identityProfileQuery.currentOrg$
      .pipe(
        filter(x => x != null),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(org => {
        this.timeZone = org.utcOffset;
        this.getDNCSkuPrices(org);
        this.onFilterChanged();
      });
  }

  reCalculator($event: { fileKey: string; file: File }) {
    this.calculateSingaporeNumber($event.file);
    this.calculateBilling($event.fileKey);
  }

  download(item: LogBulkFiltering) {
    if (!item.postback_result) {
      return;
    }
    this.urlService.download(item.postback_result).subscribe(url => {
      download(url, `logs_${item.txn_uuid}`);
    });
  }

  private calculateBilling(fileUrl: string) {
    this.logService
      .lookupRate(<LookupRateReq>{
        media: 'voice,fax,sms',
        csvKey: fileUrl,
        appId: APP_IDS.GLOBAL_DNC,
        credentialUuid: '',
        credentialType: 'identity'
      })
      .subscribe(
        res => {
          this.countSingaporeNumber = res.billing.numberOfDncCheck;
        },
        err => {
          this.toastService.error(`Cannot lookup rate because ${err.message.toLowerCase()}`);
        }
      );
  }

  private getDNCSkuPrices(org: ProfileOrg) {
    this.skuPriceService.getDNCSkuPrices(org.walletCurrencyCode, org.domain).subscribe(prices => {
      const price = prices.saleModel[0].domainPrice[0].amount;
      const discount = 0.0;
      this.price = {
        price: price,
        discount: discount,
        currency: org.walletCurrencyCode,
        real: Math.round((price - price * discount) * 1000) / 1000
      };
    });
  }

  private calculateSingaporeNumber(file) {
    const reader = new FileReader();
    let countSingaporeNumber = 0;
    reader.onload = () => {
      const text = reader.result;
      let numbers = [];
      if (text instanceof String) {
        numbers = text.split('\n');
      }
      const knumbers = this.uniqFast(numbers);
      knumbers.forEach(n => {
        if (n.trim()) {
          if (this.isSingaporeNumber(n)) {
            countSingaporeNumber++;
          }
        }
      });
      this.countSingaporeNumber = countSingaporeNumber;
    };
    reader.readAsText(file);
  }

  private onFilterChanged() {
    // this.isLoading = true;
    // this.logService
    //   .activityLogs('+' + this.searchTextCtr.value)
    //   .pipe(finalize(() => (this.isLoading = false)))
    //   .subscribe(data => {
    //     this.totalCount = data.total;
    //     this.updateDataSource(data.data);
    //   });
  }

  private uniqFast(a) {
    const seen = {};
    const out = [];
    const len = a.length;
    let j = 0;
    for (let i = 0; i < len; i++) {
      const item = a[i];
      if (seen[item] !== 1) {
        seen[item] = 1;
        out[j++] = item;
      }
    }
    return out;
  }

  private isSingaporeNumber(number: string) {
    const trippedNumber: string = number.replace(/\D+/g, '');
    return (
      (trippedNumber.length === 8 && !!trippedNumber.match(/^[3689].*/)) ||
      (trippedNumber.length === 10 && !!trippedNumber.match(/^65[3689].*/)) ||
      (trippedNumber.length === 11 && !!trippedNumber.match(/^\+65[3689].*/))
    );
  }
}
