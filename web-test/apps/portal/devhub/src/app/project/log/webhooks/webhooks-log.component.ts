import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ProjectQuery } from '@b3networks/api/flow';
import { CodeSample, ConfigurationService, WebhookLog } from '@b3networks/api/integration';
import { ViewBodyDialogComponent } from '../view-body-dialog/view-body-dialog.component';

@Component({
  selector: 'b3n-webhooks-log',
  templateUrl: './webhooks-log.component.html',
  styleUrls: ['./webhooks-log.component.scss']
})
export class WebhooksLogComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  codes: CodeSample[];
  codeCtrl = new FormControl('');

  displayedColumns = ['time', 'url', 'responseTime', 'httpStatus', 'errorMsg', 'action'];
  dataSource = new MatTableDataSource<WebhookLog>();

  constructor(
    private dialog: MatDialog,
    private projectQuery: ProjectQuery,
    private configurationService: ConfigurationService
  ) {}

  ngOnInit(): void {
    this.codeCtrl.valueChanges.subscribe(code => {
      if (code) {
        this.configurationService.getLogWebhook(this.projectQuery.getActive().subscriptionUuid, code).subscribe({
          next: res => {
            this.dataSource = new MatTableDataSource<WebhookLog>(res);
            this.dataSource.paginator = this.paginator;
          },
          error: () => {
            this.dataSource = new MatTableDataSource<WebhookLog>([]);
            this.dataSource.paginator = this.paginator;
          }
        });
      }
    });

    this.configurationService.fetchWebhookList().subscribe(codes => {
      this.codes = codes;
      if (this.codes && this.codes.length > 0) {
        this.codeCtrl.setValue(this.codes[0].code);
      }
    });
  }

  viewBody(body: string) {
    this.dialog.open(ViewBodyDialogComponent, {
      width: '500px',
      disableClose: true,
      data: body
    });
  }
}
