import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Page, Pageable } from '@b3networks/api/common';
import { GetPaymentTxnReq, Payment, PaymentService } from '@b3networks/api/payment';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'pou-payment-transaction',
  templateUrl: './payment-transaction.component.html',
  styleUrls: ['./payment-transaction.component.scss']
})
export class PaymentTransactionComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() from: Date;
  @Input() to: Date;
  @Input() status: string;

  transactionPage = new Page<Payment>();
  displayedColumns = ['amount', 'type', 'status', 'updatedDatetime'];
  loading: boolean;
  pageable: Pageable = { page: 1, perPage: 10 };

  constructor(private paymentService: PaymentService, private toastService: ToastService) {
    super();
  }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.from && this.to) {
      this.search();
    }
  }

  search() {
    this.loading = true;
    const req = {
      from: format(new Date(this.from), 'yyyy-MM-dd'),
      to: format(new Date(this.to), 'yyyy-MM-dd'),
      status: this.status.toUpperCase() === 'ALL' ? 'COMPLETED,FAILED' : this.status.toUpperCase()
    } as GetPaymentTxnReq;
    this.paymentService
      .getPaymentTransaction(req, this.pageable)
      .pipe(takeUntil(this.destroySubscriber$))
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        resp => {
          this.transactionPage = resp;
        },
        err => this.toastService.error(err.message || 'Cannot fetch payment transaction. Please try again later')
      );
  }

  onChangePage(event: PageEvent) {
    this.pageable.page = event.pageIndex + 1;
    this.search();
  }
}
