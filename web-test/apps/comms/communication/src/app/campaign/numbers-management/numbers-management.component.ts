import { ComponentType } from '@angular/cdk/portal';
import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CampaignLicenseInfo,
  CampaignLicenseService,
  CampaignTxn,
  CampaignTxnService,
  FindCampainTxnReq,
  Status,
  TxnStatusCampaign
} from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ROUTE_LINK } from '../../shared';
// import { ADMIN_LINK, APP_LINK } from '../../../shared';
import { ConfirmChangeStatusComponent } from '../confirm-change-stt/confirm-change-stt.component';

@Component({
  selector: 'b3n-numbers-management',
  templateUrl: './numbers-management.component.html',
  styleUrls: ['./numbers-management.component.scss']
})
export class NumbersManagementComponent implements OnInit {
  readonly TxnStatusCampaign = TxnStatusCampaign;
  readonly CHECK_DNC = 'Check DNC';
  readonly CHECK_CONSENT = 'Check Consent';
  readonly Status = Status;

  displayedColumns: string[] = [];
  queryParams = <FindCampainTxnReq>{
    q: '',
    status: ''
  };
  numbers: CampaignTxn[];
  isLoading = false;
  totalCount = 0;
  pageable: Pageable = <Pageable>{ page: 1, perPage: 10 };
  currentNumberListId: string;
  numberList: CampaignLicenseInfo;

  constructor(
    private campaignTxnService: CampaignTxnService,
    private actionRoute: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignLicenseService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.actionRoute.params.subscribe((urlData: any) => {
      if (!this.currentNumberListId || this.currentNumberListId !== urlData.numberListId) {
        this.currentNumberListId = urlData.numberListId;
        forkJoin([
          this.campaignTxnService.findCampaignTxnsV2(this.currentNumberListId, this.queryParams, this.pageable),
          this.campaignService.getCampaignV2(this.currentNumberListId)
        ]).subscribe((data: any) => {
          this.numbers = data[0].content;
          this.totalCount = data[0].totalCount;
          this.numberList = new CampaignLicenseInfo({
            ...data[1],
            numberCount: this.totalCount
          });
          console.log('this.numberList: ', this.numberList);
          this.displayedColumns = this.numberList.checkDnc
            ? ['number', 'dateUpload', 'startAt', 'endAt', 'dncStatus', 'status']
            : ['number', 'dateUpload', 'startAt', 'endAt', 'status'];
        });
      }
    });
  }

  changeNumberListStt(numberList: CampaignLicenseInfo) {
    this.showDialog(ConfirmChangeStatusComponent, numberList, true);
  }

  reload() {
    this.isLoading = true;
    const req = <FindCampainTxnReq>{
      status: this.queryParams.status
    };
    if (this.queryParams.q && this.queryParams.q.startsWith('+')) {
      req.q = this.queryParams.q.substring(1, this.queryParams.q.length);
    } else {
      req.q = this.queryParams.q;
    }

    forkJoin([
      this.campaignTxnService.findCampaignTxnsV2(this.currentNumberListId, req, this.pageable),
      this.campaignService.getCampaignV2(this.currentNumberListId)
    ])
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((data: any) => {
        this.numbers = data[0].content;
        this.totalCount = data[0].totalCount;
        this.numberList = new CampaignLicenseInfo({
          ...data[1],
          numberCount: this.totalCount
        });
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

  goBack() {
    this.router.navigate([ROUTE_LINK.campaign]);
  }

  compareFn(a: KeyValue<string, string>, b: KeyValue<string, string>) {
    return a && b && a.key === b.key;
  }

  private showDialog<T, D = any, R = any>(
    componentOrTemplateRef: ComponentType<T>,
    data: any,
    refreshAfter = true,
    dialogCfg: any = {}
  ): MatDialogRef<T, R> {
    dialogCfg.data = data;

    const dialogRef = this.dialog.open(componentOrTemplateRef, dialogCfg);

    if (refreshAfter) {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.reload();
        }
      });
    }

    return dialogRef;
  }
}
