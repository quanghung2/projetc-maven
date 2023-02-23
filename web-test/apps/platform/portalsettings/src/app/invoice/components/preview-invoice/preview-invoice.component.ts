import { Component, Input, OnInit } from '@angular/core';
import { NumberUtils } from '../../../utils/number-utils';
import { StringUtils } from '../../../utils/string-utils';
import { InvoiceItem } from '../../core/invoice-item.model';
import { Invoice } from '../../core/invoice.model';
import { InvoiceService } from './../../core/invoice.service';
import { PartnerInfo } from './../../core/partner-info.model';

@Component({
  selector: 'preview-invoice',
  templateUrl: './preview-invoice.component.html',
  styleUrls: ['../shared/invoice.css', '../shared/styles.scss', './preview-invoice.component.scss']
})
export class PreviewInvoiceComponent implements OnInit {
  @Input('invoice') set _invoice(inv: Invoice) {
    this.invoice = inv ? inv : new Invoice();

    // Categorize by tax rate
    this.taxAmountMap = this.categorizeTaxRate(this.invoice.items, this.invoice.taxNumber);
  }

  isLoading = true;
  invoice = new Invoice();
  partnerInfo = new PartnerInfo();
  partnerBillingCountry = '';
  taxAmountMap = new Array<{ left: number; right: number }>();

  constructor(private invoiceService: InvoiceService) {}

  ngOnInit() {
    this.invoiceService.getPartnerInfo().subscribe(p => {
      this.partnerInfo = p;
      this.partnerBillingCountry = p.billingInfo.country.name;
    });
  }

  getTotalDiscountAmount(): number {
    let amount = 0;
    this.invoice.items.filter(i => i.isValid()).forEach(i => (amount += i.totalDiscountAmount));
    return NumberUtils.roundTo3Digits(amount);
  }

  getSubTotalAmount(): number {
    let amount = 0;
    this.invoice.items.filter(i => i.isValid()).forEach(i => (amount += i.amountExclTax));
    return NumberUtils.roundTo3Digits(amount);
  }

  private categorizeTaxRate(items: Array<InvoiceItem>, taxNumber: string): Array<{ left: number; right: number }> {
    let taxAmountMap = new Array<{ left: number; right: number }>();

    items
      .filter(item => item.isValid() && item.taxRatePercent > 0)
      .forEach(item => {
        let taxAmountEntry = taxAmountMap.find(ta => ta.left === item.taxRatePercent);
        if (taxAmountEntry != null) {
          taxAmountEntry.right = taxAmountEntry.right + item.totalTaxAmount;
        } else {
          taxAmountMap.push({ left: item.taxRatePercent, right: item.totalTaxAmount });
        }
      });

    if (taxAmountMap.length === 0 && StringUtils.isNotBlank(taxNumber)) {
      taxAmountMap.push({ left: 0, right: 0 });
    }

    return taxAmountMap;
  }
}
