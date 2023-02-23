import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { TransactionsBalance, TransactionService } from '@b3networks/api/billing';
import { generateUUID } from '@b3networks/shared/common';
import { finalize, map } from 'rxjs/operators';
import { TransactionInput } from '../transactions.component';

@Component({
  selector: 'b3n-last-onehundred-transactions',
  templateUrl: './last-onehundred-transactions.component.html',
  styleUrls: ['./last-onehundred-transactions.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class LastOnehundredTransactionsComponent implements OnInit {
  @Input() data: TransactionInput;

  displayedColumns = ['description', 'quantity', 'amount', 'closingBalance', 'type', 'createdAt'];
  expandedElement: string | null = null;
  transactions = new MatTableDataSource<TransactionsBalance>();
  isLoading: boolean;
  timezone: string;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.timezone = this.data?.timezone;
    this.isLoading = true;
    this.transactionService
      .getLast100Transactions(this.data.sellerUuid, this.data.buyerUuid, this.data.currency)
      .pipe(
        finalize(() => (this.isLoading = false)),
        map((res: any) => {
          res.forEach(x => {
            if (x['invoiceGroup'] == null) {
              x['key'] = generateUUID();
            } else {
              x['key'] = x['txnRef'] + x['invoiceGroup'];
            }
          });
          const grouped = this.groupBy(res, 'key');
          const results: TransactionsBalance[] = [];
          for (const key in grouped) {
            if (grouped.hasOwnProperty(key)) {
              const closingBalance = Math.min.apply(
                null,
                grouped[key].map(x => x.closingBalance)
              );
              const itemTransactionNeared = grouped[key].find(item => item.closingBalance === closingBalance);
              if (itemTransactionNeared) {
                const tmp: TransactionsBalance = {
                  description:
                    grouped[key].length > 1 ? itemTransactionNeared.invoiceGroup : itemTransactionNeared.description,
                  quantity: itemTransactionNeared.quantity,
                  items: grouped[key],
                  totalAmount: grouped[key].map(x => x.amount).reduce((a, b) => a + b),
                  closingBalance: closingBalance,
                  amount: itemTransactionNeared.amount,
                  type: itemTransactionNeared.type,
                  createAt: itemTransactionNeared.time,
                  key: key
                };
                results.push(tmp);
              }
            }
          }

          return results.sort((a, b) => Number(b.items[0].createdAt) - Number(a.items[0].createdAt)).slice(0, 100);
        })
      )
      .subscribe((data: TransactionsBalance[]) => {
        this.transactions = new MatTableDataSource<TransactionsBalance>(data);
        this.transactions.paginator = this.paginator;
      });
  }

  onShowTransactionDetail(element: TransactionsBalance) {
    if (element.items.length < 2) {
      return;
    }
    this.expandedElement = this.expandedElement === element.key ? null : element.key;
  }

  groupBy(xs, key) {
    return xs.reduce((rv, x) => {
      (rv[x[key]] = rv[x[key]] || []).push(x);
      return rv;
    }, {});
  }
}
