import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignLicenseInfo, CampaignLicenseService, CampaignType } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';

export interface NumbersDetailData {
  campaign: CampaignLicenseInfo;
}

@Component({
  selector: 'b3n-campaign-detail',
  templateUrl: './campaign-detail.component.html',
  styleUrls: ['./campaign-detail.component.scss']
})
export class CampaignDetailComponent extends DestroySubscriberComponent implements OnInit {
  campaign: CampaignLicenseInfo;

  readonly CampaignType = CampaignType;

  constructor(
    public dialogRef: MatDialogRef<CampaignDetailComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: CampaignLicenseInfo,
    public dialog: MatDialog,
    private campaignService: CampaignLicenseService
  ) {
    super();
    this.campaign = data;
  }

  ngOnInit() {
    this.campaignService.getCampaignV2(this.data.uuid).subscribe((data: any) => {
      this.campaign = new CampaignLicenseInfo({
        ...this.campaign,
        ...data
      });
    });
  }
}
