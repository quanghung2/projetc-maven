import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ApiKeyManagementService, ApiKeyQuery, ApiLog } from '@b3networks/api/integration';
import { ViewBodyDialogComponent } from '../view-body-dialog/view-body-dialog.component';

@Component({
  selector: 'b3n-open-api-reqs-log',
  templateUrl: './open-api-reqs-log.component.html',
  styleUrls: ['./open-api-reqs-log.component.scss']
})
export class OpenApiReqsLogComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns = ['time', 'ipAddress', 'method', 'path', 'queryString', 'httpStatus', 'action'];
  dataSource = new MatTableDataSource<ApiLog>();

  constructor(
    private dialog: MatDialog,
    private apiKeyQuery: ApiKeyQuery,
    private apiKeyManagementService: ApiKeyManagementService
  ) {}

  ngOnInit(): void {
    const apiKeyId = this.apiKeyQuery.getValue().apiKey?.id;
    if (apiKeyId) {
      this.apiKeyManagementService.getLogApi(apiKeyId).subscribe({
        next: res => {
          this.dataSource = new MatTableDataSource<ApiLog>(res);
          this.dataSource.paginator = this.paginator;
        },
        error: () => {
          this.dataSource = new MatTableDataSource<ApiLog>([]);
          this.dataSource.paginator = this.paginator;
        }
      });
    } else {
      this.dataSource = new MatTableDataSource<ApiLog>([]);
      this.dataSource.paginator = this.paginator;
    }
  }

  viewBody(body: string) {
    this.dialog.open(ViewBodyDialogComponent, {
      width: '500px',
      disableClose: true,
      data: body
    });
  }
}
