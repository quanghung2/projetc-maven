import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-duplicate-number-list-dialog',
  templateUrl: './duplicate-number-list-dialog.component.html',
  styleUrls: ['./duplicate-number-list-dialog.component.scss']
})
export class DuplicateNumberListsDialogComponent implements OnInit {
  isCreating: boolean;
  req = {
    name: '',
    queueUuid: '',
    clonedFromCampaignUuid: '',
    includeCampaignNumbers: false
  };

  constructor(
    public dialogRef: MatDialogRef<any>,
    @Inject(MAT_DIALOG_DATA) public infoData,
    private campaignService: CampaignService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.req.clonedFromCampaignUuid = this.infoData.numberListInfo.uuid;
  }

  create() {
    this.isCreating = true;
    this.req.queueUuid = this.infoData.numberListInfo.queueUuid;
    this.campaignService.createCampaign(this.req).subscribe(
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
