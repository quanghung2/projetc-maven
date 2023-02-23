import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import {
  CannedResponse,
  CannedResponseQuery,
  CannedResponseService,
  CannedResponseStatus,
  ResponseLevel
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { filter, takeUntil } from 'rxjs/operators';
import { ResponseDetailDialogComponent } from './response-detail-dialog/response-detail-dialog.component';

@Component({
  selector: 'b3n-responses',
  templateUrl: './responses.component.html',
  styleUrls: ['./responses.component.scss']
})
export class ResponsesComponent extends DestroySubscriberComponent implements AfterViewInit, OnInit {
  cannedResponses: CannedResponse[] = [];
  allCannedResponses: CannedResponse[] = [];
  level: ResponseLevel;
  displayedColumns = ['displayName', 'subject', 'status', 'action'];
  dataSource: MatTableDataSource<CannedResponse>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private cannedResponseQuery: CannedResponseQuery,
    private cannedResponseService: CannedResponseService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      if (params) {
        this.level = params['level'];
        this.filterResponseByLevel();
      }
    });
  }

  ngAfterViewInit() {
    this.cannedResponseQuery.selectEmailCannedResponses$
      .pipe(
        filter(s => !!(s && s.length)),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(cannedResponses => {
        this.allCannedResponses = cannedResponses;
        this.filterResponseByLevel();
      });
  }

  filterResponseByLevel() {
    this.cannedResponses = this.allCannedResponses.filter(item => item.level === this.level);
    this.updateDataSource();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: CannedResponse, value: string): boolean => {
      return data.name.toLowerCase().indexOf(value) > -1;
    };
  }

  viewDetail(selectedResponse: CannedResponse) {
    if (!selectedResponse) {
      selectedResponse = new CannedResponse(<CannedResponse>{ id: 0, level: this.level });
    }
    this.dialog.open(ResponseDetailDialogComponent, {
      width: '950px',
      data: { ...selectedResponse }
    });
  }

  changeVisible(e, cannedResponse: CannedResponse) {
    e.stopPropagation();
    if (cannedResponse.status === CannedResponseStatus.active) {
      cannedResponse = { ...cannedResponse, status: CannedResponseStatus.archived };
    } else if (cannedResponse.status === CannedResponseStatus.archived) {
      cannedResponse = { ...cannedResponse, status: CannedResponseStatus.active };
    }
    this.cannedResponseService.updateEmailCannedResponse(cannedResponse).subscribe();
  }

  private updateDataSource() {
    this.cannedResponses.sort((a, b) => a.id - b.id);
    this.dataSource = new MatTableDataSource<CannedResponse>(this.cannedResponses);
    this.dataSource.paginator = this.paginator;
  }

  delete($event: boolean, item: CannedResponse) {
    this.cannedResponseService.deleteEmailCannedResponse(item).subscribe();
  }
}
