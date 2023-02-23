import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import {
  Invoice,
  InvoiceStatus,
  SearchInvoiceReq,
  UserInvoiceQuery,
  UserInvoiceService
} from '@b3networks/api/invoice';
import { DestroySubscriberComponent, downloadData } from '@b3networks/shared/common';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import * as JSZip from 'jszip';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'poi-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.scss']
})
export class InvoicesComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  filterDate: Date;
  selectedStatus: InvoiceStatus | '' = '';
  loading$: Observable<boolean>;
  isDownloading: boolean;

  dataSource: MatTableDataSource<Invoice> = new MatTableDataSource<Invoice>();

  checkedInvoiceNumbers: string[] = [];

  get isAllInvoiceChecked(): boolean {
    if (this.dataSource && this.dataSource.filteredData.length) {
      return this.dataSource.filteredData.filter(pi => !this.isInvoiceChecked(pi)).length === 0;
    }
    return false;
  }

  get isSomeInvoiceChecked() {
    if (!this.checkedInvoiceNumbers.length) {
      return false;
    }

    return this.checkedInvoiceNumbers.length > 0 && !this.isAllInvoiceChecked;
  }

  readonly displayedColumns: string[] = ['checked', 'date', 'number', 'due', 'paid', 'currency', 'status', 'action'];

  @ViewChild(MatPaginator) paginator: MatPaginator | null;

  constructor(private invoiceService: UserInvoiceService, private userInvoiceQuery: UserInvoiceQuery) {
    super();
  }

  ngOnInit(): void {
    this.loading$ = this.userInvoiceQuery.loading$;
    combineLatest(this.userInvoiceQuery.selectedFilterDate$, this.userInvoiceQuery.slectedInvoiceStatus$)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([filterDate, selectedStatus]) => {
        this.filterDate = filterDate;
        this.selectedStatus = selectedStatus;
        this.refreshData();
      });
  }

  ngAfterViewInit(): void {
    this.userInvoiceQuery.invoices$.subscribe((invoices: Invoice[]) => {
      this.dataSource = new MatTableDataSource<Invoice>(invoices);
      this.dataSource.paginator = this.paginator;
    });
  }

  getDisplayDate(date: number) {
    return format(new Date(date), 'dd MMM yyyy h:mm a');
  }

  isInvoiceChecked(inv: Invoice): boolean {
    return this.checkedInvoiceNumbers.indexOf(inv.number) !== -1;
  }

  selectInvoice(inv: Invoice) {
    const { number } = inv;
    const idx = this.checkedInvoiceNumbers.indexOf(number);
    if (idx !== -1) {
      this.checkedInvoiceNumbers.splice(idx, 1);
    } else {
      this.checkedInvoiceNumbers.push(number);
    }
  }

  selectAllInvoices(event: MatCheckboxChange) {
    const { checked } = event;

    if (checked) {
      this.dataSource.filteredData
        .filter(pi => !this.isInvoiceChecked(pi))
        .forEach(pi => this.checkedInvoiceNumbers.push(pi.number));
    } else {
      this.dataSource.filteredData
        .filter(pi => this.isInvoiceChecked(pi))
        .forEach(pi => {
          const idx = this.checkedInvoiceNumbers.indexOf(pi.number);
          this.checkedInvoiceNumbers.splice(idx, 1);
        });
    }
  }

  downloadInvoice(invoiceData: Invoice) {
    const { number } = invoiceData;
    this.invoiceService.exportPdf(number).subscribe(blob => {
      this.toPdfFile(blob, number);
    });
  }

  onDownloadChanged() {
    const zipFile = new JSZip();
    const downloadFileObservable = [];

    const checkedInvoices = this.dataSource?.filteredData.filter(inv => this.isInvoiceChecked(inv));

    checkedInvoices.forEach(({ number }: Invoice) => {
      downloadFileObservable.push(this.invoiceService.exportPdf(number));
    });

    this.isDownloading = true;
    forkJoin(downloadFileObservable)
      .pipe(finalize(() => (this.isDownloading = false)))
      .subscribe(response => {
        response.forEach((content: any, index) => {
          const fileName = checkedInvoices[index].number + '.pdf';
          const dic = { binary: true };
          zipFile.file(fileName, content, dic);
        });
        zipFile.generateAsync({ type: 'blob' }).then(content => {
          let suffix = format(this.filterDate, 'MMyyyy');
          if (suffix.length < 6) suffix = '0' + suffix;

          downloadData(content, 'invoices_' + suffix);
        });
      });
  }

  private refreshData() {
    this.checkedInvoiceNumbers = [];

    const req = <SearchInvoiceReq>{
      startDate: this.getStartDateFromMonth(),
      endDate: this.getEndDateFromMonth(),
      paid: !this.selectedStatus || this.selectedStatus === InvoiceStatus.paid,
      awaitingPayment: !this.selectedStatus || this.selectedStatus === InvoiceStatus.sent
    };

    this.invoiceService.searchInvoices(req).subscribe();
  }

  private getStartDateFromMonth() {
    return Number(utcToZonedTime(startOfMonth(this.filterDate), '+00:00'));
  }

  private getEndDateFromMonth() {
    return Number(utcToZonedTime(endOfMonth(this.filterDate), '+00:00'));
  }

  private toPdfFile(blob: Blob, fileName: string) {
    if (fileName && !fileName.endsWith('.pdf')) {
      fileName += '.pdf';
    }
    downloadData(blob, fileName);
  }
}
