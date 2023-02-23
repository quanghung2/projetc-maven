import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FileService } from '@b3networks/api/file';
import { Report, ReportsService } from '@b3networks/api/infra';
import { downloadData, getFilenameFromHeader } from '@b3networks/shared/common';
import { format } from 'date-fns';
import { finalize } from 'rxjs';

@Component({
  selector: 'b3n-automation-test',
  templateUrl: './automation-test.component.html',
  styleUrls: ['./automation-test.component.scss']
})
export class AutomationTestComponent implements OnInit {
  dataSource: MatTableDataSource<Report & { finishedAt: string; testName: string }>;
  displayedColumns = ['test name', 'finished at', 'actions'];
  scheduleDate: Date | null;
  scheduleDateDefault: Date | null;
  isLoading: boolean;
  isDownload: boolean;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private reportsService: ReportsService, private fileService: FileService) {}

  onLoadReport(date?: string) {
    this.isLoading = true;
    this.reportsService
      .getReports(date)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((reports: Report[]) => {
        this.dataSource = new MatTableDataSource<Report & { finishedAt: string; testName: string }>(
          reports
            .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
            .map(report => ({
              ...report,
              finishedAt: format(new Date(report.createdAt), 'yyyy-MM-dd HH:mm:ss'),
              testName: report.htmlFileKey.split('/').at(-1)
            }))
        );
        this.dataSource.paginator = this.paginator;
        this.dataSource.paginator.firstPage();
      });
  }

  ngOnInit(): void {
    this.onLoadReport();
    this.scheduleDateDefault = null;
    this.scheduleDate = null;
  }

  onSearchReport() {
    const { scheduleDateDefault, scheduleDate } = this;
    if (scheduleDateDefault !== scheduleDate) {
      this.scheduleDateDefault = scheduleDate;
      this.onLoadReport(scheduleDate && format(new Date(scheduleDate), 'yyyy-MM-dd'));
    }
  }

  onRefresh() {
    this.scheduleDate = null;
    this.scheduleDateDefault = null;
    this.onLoadReport();
  }

  onDownloadReport(item: Report & { finishedAt: string; testName: string }) {
    this.isDownload = true;
    this.fileService
      .downloadFileV3(item.htmlFileKey, { sharingOrgUuid: item.orgUuid })
      .pipe(finalize(() => (this.isDownload = false)))
      .subscribe(resp => {
        const fileName: string =
          getFilenameFromHeader(resp.headers) ||
          `${item.testName}_${format(new Date(item.createdAt), 'yyyy/MM/dd_HH-mm-ss')}.html`;
        const file = new Blob([resp.body], { type: `${resp.body.type}` });
        downloadData(file, fileName);
      });
  }

  onViewReport(item: Report) {
    this.isDownload = true;
    this.fileService
      .downloadFileV3(item.htmlFileKey, { sharingOrgUuid: item.orgUuid })
      .pipe(finalize(() => (this.isDownload = false)))
      .subscribe(resp => {
        resp.body.text().then(text => window.open().document.write(text));
      });
  }
}
