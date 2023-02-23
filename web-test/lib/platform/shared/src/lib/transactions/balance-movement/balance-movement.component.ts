import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { BalanceForBuyer, BalanceForBuyerDetail, WalletService } from '@b3networks/api/billing';
import { GetReportV4Payload, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import { addDays, startOfDay } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { finalize, map } from 'rxjs/operators';
import { TransactionExportComponent } from '../transaction-export/transaction-export.component';
import { TransactionInput } from '../transactions.component';

@Component({
  selector: 'b3n-balance-movement',
  templateUrl: './balance-movement.component.html',
  styleUrls: ['./balance-movement.component.scss']
})
export class BalanceMovementComponent implements OnInit {
  @Input() data: TransactionInput;

  balanceColumns = ['date', 'changes', 'closeBalance'];
  balanceDetailColumns = ['description', 'amount', 'type'];
  balances = new MatTableDataSource<BalanceForBuyer>();
  balancesLoading: boolean;
  balancesDetail: BalanceForBuyerDetail[] = [];
  balancesDetailLoading: boolean;
  selectedRow: BalanceForBuyer;
  currency: string;
  timezone: string;
  exportForBuyer: boolean;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private walletService: WalletService,
    private identityProfileQuery: IdentityProfileQuery,
    private v4Service: V4Service,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.timezone = this.data.timezone;
    this.currency = this.data.currency;
    this.balancesLoading = true;
    this.identityProfileQuery.currentOrg$.subscribe(org => {
      this.timezone = org.utcOffset;
      if (org.orgUuid === this.data.buyerUuid) {
        this.exportForBuyer = false;
        this.walletService.getBalanceMovementForSeller(this.data.sellerUuid, this.currency).subscribe(balances => {
          this.setData(balances);
        });
      } else {
        this.exportForBuyer = true;
        this.walletService.getBalanceMovementForBuyer(this.data.buyerUuid, this.currency).subscribe(balances => {
          this.setData(balances);
        });
      }
    });
  }

  private setData(balances: BalanceForBuyer[]) {
    if (balances.length) {
      this.selectedRow = balances[0];
      this.getGroupTransactionsForEachRow(balances[0]);
      this.balances = new MatTableDataSource<BalanceForBuyer>(balances);
      this.balances.paginator = this.paginator;
    }
    this.balancesLoading = false;
  }

  getGroupTransactionsForEachRow(row: BalanceForBuyer) {
    this.selectedRow = row;
    this.balancesDetailLoading = true;
    this.balancesDetail = [];
    this.v4Service
      .getReportData<BalanceForBuyerDetail>(
        Period['1d'],
        this.exportForBuyer ? ReportV4Code.sellerGroupedBill : ReportV4Code.billingBuyerBalanceMovement,
        <GetReportV4Payload>{
          startTime: format(
            startOfDay(utcToZonedTime(row.date ? row.date : new Date(), this.timezone)),
            "yyyy-MM-dd'T'HH:mm:ssxxx",
            {
              timeZone: this.timezone
            }
          ),
          endTime: format(
            addDays(startOfDay(utcToZonedTime(row.date ? row.date : new Date(), this.timezone)), 1),
            "yyyy-MM-dd'T'HH:mm:ssxxx",
            {
              timeZone: this.timezone
            }
          ),
          queryString: this.exportForBuyer ? this.data.buyerUuid : this.data.sellerUuid
        },
        null,
        true
      )
      .pipe(
        map(resp => resp.rows.map(x => new BalanceForBuyerDetail(x))),
        finalize(() => (this.balancesDetailLoading = false))
      )
      .subscribe(detail => {
        this.balancesDetail = detail;
      });
  }

  export() {
    this.dialog.open(TransactionExportComponent, {
      width: '400px',
      data: {
        sellerUuid: this.exportForBuyer ? null : this.data.sellerUuid,
        buyerUuid: this.exportForBuyer ? this.data.buyerUuid : null,
        currency: this.currency,
        selectedDate: this.selectedRow?.date
      }
    });
  }
}
