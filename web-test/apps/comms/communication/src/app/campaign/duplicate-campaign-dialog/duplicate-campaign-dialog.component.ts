import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignInfo, CampaignLicenseInfo, CampaignLicenseService, CampaignType } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-duplicate-campaign-dialog',
  templateUrl: './duplicate-campaign-dialog.component.html',
  styleUrls: ['./duplicate-campaign-dialog.component.scss']
})
export class DuplicateCampaignDialogComponent implements OnInit {
  isCreating: boolean;
  req: Partial<CampaignLicenseInfo> = {
    name: '',
    queueUuid: '',
    clonedFromCampaignUuid: '',
    includeCampaignNumbers: false
  };

  constructor(
    public dialogRef: MatDialogRef<DuplicateCampaignDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public infoData: { numberListInfo: CampaignInfo },
    private campaignService: CampaignLicenseService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.req.clonedFromCampaignUuid = this.infoData.numberListInfo.uuid;
  }

  create() {
    this.isCreating = true;
    if (this.infoData.numberListInfo.type === CampaignType.voice) {
      // flow
      this.req = {
        ...this.req,
        flowUuid: this.infoData.numberListInfo.flowUuid,
        flowBaseSubscriptionUuid: this.infoData.numberListInfo.flowUuid
      };

      if (this.infoData.numberListInfo.queueUuid) {
        this.req.queueUuid = this.infoData.numberListInfo.queueUuid;
      }
    }
    this.campaignService.createCampaignV2(this.req).subscribe(
      res => {
        this.toastService.success('Duplicated successfully!');
        this.dialogRef.close(res);
      },
      err => {
        this.toastService.error(err.message);
        this.dialogRef.close(false);
      }
    );
  }
}
