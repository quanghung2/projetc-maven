import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FileInfo, FileService } from '@b3networks/api/file';
import { GetTransactionReportReq, TransactionReportResp, TransactionReportService } from '@b3networks/api/portal';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format, isBefore, startOfMonth } from 'date-fns';
import { finalize } from 'rxjs/operators';
import { TypeMapping } from '../usage-history.component';

@Component({
  selector: 'pou-general-report',
  templateUrl: './general-report.component.html',
  styleUrls: ['./general-report.component.scss']
})
export class GeneralReportComponent implements OnInit, OnChanges {
  @Input() domain: string;
  @Input() type: string;
  @Input() filterDate: string;
  @Input() monthChanged: boolean;

  reportFiles: FileInfo[] = [];
  migratedMonth = startOfMonth(new Date('2018-11'));
  data: TransactionReportResp;
  loading: boolean;
  collectFromFileModule = false;
  displayedColumns = ['name', 'date', 'file'];

  constructor(
    private transactionReportService: TransactionReportService,
    private toastService: ToastService,
    private fileService: FileService
  ) {}

  ngOnInit() {}

  ngOnChanges() {
    if (!this.monthChanged) return;
    this.loading = true;
    if (isBefore(startOfMonth(new Date(this.filterDate)), this.migratedMonth)) {
      const req = {
        type: this.type,
        month: format(new Date(this.filterDate), 'MM-yyyy'),
        domain: this.domain
      } as GetTransactionReportReq;
      this.transactionReportService
        .fetchTransactionReports(req)
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(
          (response: TransactionReportResp) => {
            this.data = response;
          },
          _ => {
            this.toastService.error(
              'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
            );
          }
        );
    } else {
      this.collectFromFileModule = true;
      this.queryFiles();
    }
  }

  getDisplayDate(date: number) {
    return format(new Date(date), 'dd MMM yyyy h:mm a');
  }

  getDisplayName() {
    return `Report on ` + format(new Date(this.filterDate), 'MMM yyyy');
  }

  queryFiles() {
    const prefix = TypeMapping[this.type];
    const filename = format(new Date(this.filterDate), 'yyyy-MM');

    this.fileService
      .queryFiles(`${prefix}/${filename}`, '', 12, 'false', this.domain)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        data => {
          this.reportFiles = [];
          if (data.files && data.files.length > 0) {
            this.reportFiles = data.files
              .filter(file => file.name.startsWith(format(new Date(this.filterDate), 'yyyy-MM')))
              .map(file => {
                file['displayName'] = `Report on ${format(new Date(file.name.substr(0, 7)), 'MMM yyyy')}`;
                return file;
              });
          }
        },
        _ => {
          this.toastService.error(
            'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
          );
        }
      );
  }

  downloadReport(file: FileInfo) {
    this.fileService.getDownloadFileUrl(file.key).subscribe(data => {
      const element = document.createElement('a');
      element.setAttribute('href', data.url);
      element.setAttribute('download', `${this.type}-${file.name}`);

      element.style.display = 'none';
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);
    });
  }
}
