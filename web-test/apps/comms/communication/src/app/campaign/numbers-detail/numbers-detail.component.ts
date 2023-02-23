import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CampaignLicenseInfo,
  CampaignLicenseService,
  CampaignTxn,
  CampaignTxnService,
  FindCampainTxnReq,
  TxnStatusCampaign
} from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface NumbersDetailData {
  campaign: CampaignLicenseInfo;
}

@Component({
  selector: 'b3n-numbers-detail',
  templateUrl: './numbers-detail.component.html',
  styleUrls: ['./numbers-detail.component.scss']
})
export class NumbersDetailComponent extends DestroySubscriberComponent implements OnInit {
  searchCtrl = new UntypedFormControl('');
  isLoading: boolean;
  loadingFirst = true;
  pageable: Pageable = <Pageable>{ page: 1, perPage: 10 };
  displayedColumns = ['number', 'dateUpload'];
  numbers: CampaignTxn[];
  totalCount = 0;

  readonly TxnStatusCampaign = TxnStatusCampaign;

  constructor(
    public dialogRef: MatDialogRef<NumbersDetailComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: NumbersDetailData,
    public dialog: MatDialog,
    private campaignTxnService: CampaignTxnService,
    private campaignService: CampaignLicenseService
  ) {
    super();
  }

  ngOnInit() {
    forkJoin([
      this.campaignTxnService.findCampaignTxnsV2(
        this.data.campaign.uuid,
        <FindCampainTxnReq>{
          q: '',
          status: ''
        },
        this.pageable
      ),
      this.campaignService.getCampaignV2(this.data.campaign.uuid)
    ])
      .pipe(finalize(() => (this.loadingFirst = false)))
      .subscribe((data: any) => {
        this.numbers = data[0].content;
        this.totalCount = data[0].totalCount;
        this.data.campaign = new CampaignLicenseInfo({
          ...data[1],
          numberCount: this.totalCount
        });
      });
  }

  onChangePage(page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.reload();
  }

  reload() {
    this.isLoading = true;
    const req = <FindCampainTxnReq>{
      status: ''
    };
    if (this.searchCtrl.value && this.searchCtrl.value.startsWith('+')) {
      req.q = this.searchCtrl.value.substring(1, this.searchCtrl.value.length);
    } else {
      req.q = this.searchCtrl.value;
    }

    forkJoin([
      this.campaignTxnService.findCampaignTxnsV2(this.data.campaign.uuid, req, this.pageable),
      this.campaignService.getCampaignV2(this.data.campaign.uuid)
    ])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((data: any) => {
        this.numbers = data[0].content;
        this.totalCount = data[0].totalCount;
        this.data.campaign = new CampaignLicenseInfo({
          ...data[1],
          numberCount: this.totalCount
        });
      });
  }
}
