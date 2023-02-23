import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CampaignInfo,
  CampaignService,
  CampaignTxn,
  CampaignTxnService,
  FindCampainTxnReq,
  TxnStatusCampaign
} from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-numbers-management',
  templateUrl: './numbers-management.component.html',
  styleUrls: ['./numbers-management.component.scss']
})
export class NumbersManagementComponent implements OnInit {
  readonly TxnStatusCampaign = TxnStatusCampaign;

  displayedColumns: string[] = [];
  queryParams = <FindCampainTxnReq>{
    q: '',
    status: ''
  };
  numbers: CampaignTxn[];
  isLoading: boolean = false;
  totalCount: number = 0;
  pageable: Pageable = <Pageable>{ page: 1, perPage: 10 };
  currentNumberListId: string;
  numberList: CampaignInfo;

  constructor(
    private campaignTxnService: CampaignTxnService,
    private actionRoute: ActivatedRoute,
    private spinnerService: LoadingSpinnerSerivce,
    private router: Router,
    private campaignService: CampaignService
  ) {}

  ngOnInit() {
    this.actionRoute.params.subscribe((urlData: any) => {
      if (!this.currentNumberListId || this.currentNumberListId !== urlData.numberListId) {
        this.currentNumberListId = urlData.numberListId;
        this.spinnerService.showSpinner();
        forkJoin([
          this.campaignTxnService.findCampaignTxns(this.currentNumberListId, this.queryParams, this.pageable),
          this.campaignService.getCampaign(this.currentNumberListId)
        ])
          .pipe(
            finalize(() => {
              this.spinnerService.hideSpinner();
            })
          )
          .subscribe((data: any) => {
            this.numbers = data[0].content;
            this.totalCount = data[0].totalCount;
            this.numberList = data[1];
            this.displayedColumns = this.numberList.checkDnc
              ? ['number', 'dateUpload', 'startAt', 'endAt', 'dncStatus', 'status']
              : ['number', 'dateUpload', 'startAt', 'endAt', 'status'];
          });
      }
    });
  }

  reload() {
    this.isLoading = true;
    let req = <FindCampainTxnReq>{
      status: this.queryParams.status
    };
    if (this.queryParams.q && this.queryParams.q.startsWith('+')) {
      req.q = this.queryParams.q.substr(1, this.queryParams.q.length);
    } else {
      req.q = this.queryParams.q;
    }

    this.campaignTxnService
      .findCampaignTxns(this.currentNumberListId, req, this.pageable)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(data => {
        this.numbers = data.content;
        this.totalCount = data.totalCount;
      });
  }

  moveToNumberLists() {
    this.router.navigate(['number-lists']);
  }

  onChangePage(page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.reload();
  }

  compareFn(a: KeyValue<string, string>, b: KeyValue<string, string>) {
    return a && b && a.key === b.key;
  }
}
