import { ComponentType } from '@angular/cdk/portal';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import {
  CampaignLicenseInfo,
  CampaignLicenseService,
  CampaignType,
  FindCampaignReq,
  Status
} from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { Flow, SimpleAppFlowService } from '@b3networks/api/flow';
import { FeatureQuery, LicenseFeatureCode, LicenseService, MeQuery } from '@b3networks/api/license';
import { Subscription } from '@b3networks/api/subscription';
import { OrderBy, SortUtils } from '@b3networks/comms/callcenter/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ROUTE_LINK } from '../shared';
import { CampaignDetailComponent } from './campaign-detail/campaign-detail.component';
import { ConfirmChangeStatusComponent } from './confirm-change-stt/confirm-change-stt.component';
import { DeleteCampaignComponent } from './delete-campaign/delete-campaign.component';
import { DuplicateCampaignDialogComponent } from './duplicate-campaign-dialog/duplicate-campaign-dialog.component';
import { NumbersDetailComponent, NumbersDetailData } from './numbers-detail/numbers-detail.component';
import { ScheduleCampaignComponent } from './schedule-campaign/schedule-campaign.component';
import { StoreCampaignComponent, StoreCampaignData } from './store-campaign/store-campaign.component';
import { WorktimeCampaignComponent, WorktimeCampaignInput } from './worktime-campaign/worktime-campaign.component';

const TRIGGER_DEF_ID_ROBOCALL_CAMPAIGN = 'c14aff4f-da54-4785-872f-b52c04094b53';
const TRIGGER_DEF_ID_SMS_CAMPAIGN = '80dedfea-7611-459d-857a-64c544c1a4de';
const TAG_SMS_CAMPAIGN = 'message';
const TAG_ROBOCALL_CAMPAIGN = 'voice';

@Component({
  selector: 'b3n-campaign',
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.scss']
})
export class CampaignComponent extends DestroySubscriberComponent implements OnInit {
  findCampaignReq = new FindCampaignReq();
  loading = false;
  numberLists: CampaignLicenseInfo[];
  displayedColumns = ['uuid', 'name', 'number-count', 'status', 'type', 'actions'];
  numberListStatus = Status;
  globalDncSubs: Subscription[] = [];
  dataSource: MatTableDataSource<CampaignLicenseInfo> = new MatTableDataSource<CampaignLicenseInfo>();
  totalCount = 0;
  pageable: Pageable = new Pageable(1, 10);

  hasSMSLicense: boolean;
  hasRobocall: boolean;
  hasContactCenter: boolean;

  flowsSMS: Flow[] = [];
  flowsRobocall: Flow[] = [];

  readonly CHECK_DNC = 'Check DNC';
  readonly CHECK_CONSENT = 'Check Consent';
  readonly CampaignType = CampaignType;
  readonly Status = Status;

  constructor(
    private dialog: MatDialog,
    private toastService: ToastService,
    private router: Router,
    private featureQuery: FeatureQuery,
    private simpleAppFlowService: SimpleAppFlowService,
    private licenseService: LicenseService,
    private campaignLicenseService: CampaignLicenseService,
    private meQuery: MeQuery
  ) {
    super();
  }

  ngOnInit() {
    this.licenseService
      .getLicenseFilterByFeature(LicenseFeatureCode.developer, LicenseFeatureCode.license_sms_campaign)
      .subscribe(data => {
        this.hasSMSLicense = data?.length > 0;
      });

    this.featureQuery.hasDeveloperLicense$.pipe(takeUntil(this.destroySubscriber$)).subscribe(result => {
      this.hasRobocall = result;
    });
    this.meQuery.hasContactCenterLicense$.pipe(takeUntil(this.destroySubscriber$)).subscribe(result => {
      this.hasContactCenter = result;
    });

    this.loading = true;
    forkJoin([
      this.simpleAppFlowService.getFlowsByCampaign(TRIGGER_DEF_ID_ROBOCALL_CAMPAIGN, TAG_ROBOCALL_CAMPAIGN),
      this.simpleAppFlowService.getFlowsByCampaign(TRIGGER_DEF_ID_SMS_CAMPAIGN, TAG_SMS_CAMPAIGN)
    ])
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(flows => {
        this.flowsRobocall = flows[0];
        this.flowsSMS = flows[1];
        this.reload();
      });
  }

  numberManagement(campaign: CampaignLicenseInfo) {
    if (campaign.status === Status.draft) {
      this.dialog.open(NumbersDetailComponent, {
        data: <NumbersDetailData>{
          campaign: campaign
        },
        disableClose: true,
        width: '700px',
        minHeight: '500px'
      });
    } else {
      this.dialog.open(CampaignDetailComponent, {
        data: <CampaignLicenseInfo>campaign,
        width: '500px'
      });
    }
  }

  reportCampaignManagement(campaign: CampaignLicenseInfo) {
    this.router.navigate([ROUTE_LINK.campaign, 'report', campaign.uuid]);
  }

  worktimeDialog(campaign: CampaignLicenseInfo) {
    this.dialog.open(WorktimeCampaignComponent, {
      data: <WorktimeCampaignInput>{ numberListData: campaign, disableClose: true }
    });
  }

  schedule(campaign: CampaignLicenseInfo) {
    campaign.fromCampaign = true;
    this.dialog
      .open(ScheduleCampaignComponent, {
        width: '600px',
        maxHeight: '700px',
        data: campaign,
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe((data: CampaignLicenseInfo) => {
        if (data) {
          this.reload();
        }
      });
  }

  create() {
    const dialogRef = this.dialog.open(StoreCampaignComponent, {
      data: <StoreCampaignData>{
        globalDncSubs: this.globalDncSubs,
        flowsSMS: this.flowsSMS,
        flowsRobocall: this.flowsRobocall,
        hasRobocall: this.hasRobocall,
        hasSMSLicense: this.hasSMSLicense
      },
      width: '600px',
      maxHeight: '750px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reload();
      }
    });
  }

  edit(uuid) {
    this.showDialog(
      StoreCampaignComponent,
      <StoreCampaignData>{
        numberListData: this.getCampaignByUuid(uuid),
        globalDncSubs: this.globalDncSubs,
        flowsSMS: this.flowsSMS,
        flowsRobocall: this.flowsRobocall,
        hasRobocall: this.hasRobocall,
        hasSMSLicense: this.hasSMSLicense,
        hasContactCenter: this.hasContactCenter
      },
      true,
      { width: '600px', maxHeight: '750px' }
    );
  }

  changeNumberListStt(numberList: CampaignLicenseInfo) {
    this.showDialog(ConfirmChangeStatusComponent, numberList);
  }

  duplicate(uuid) {
    this.showDialog(DuplicateCampaignDialogComponent, {
      numberListInfo: this.getCampaignByUuid(uuid)
    });
  }

  delete(uuid) {
    this.showDialog(DeleteCampaignComponent, {
      campaign: this.getCampaignByUuid(uuid)
    });
  }

  reload() {
    if (this.pageable.page === 1) {
      this.loading = true;
    }

    this.campaignLicenseService
      .findCampaignsPageV2(this.findCampaignReq, this.pageable)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(data => {
        this.totalCount = data.totalCount;
        this.numberLists = SortUtils.sortBy(data.content, 'updatedAt', OrderBy.DESC);

        this.numberLists.forEach(numberList => {
          if (numberList.type === CampaignType.voice) {
            numberList.flowLable = this.flowsRobocall.find(x => x.uuid === numberList.flowUuid)?.name;
          } else if (numberList.type === CampaignType.sms) {
            numberList.flowSMSLable = this.flowsSMS.find(x => x.uuid === numberList.flowUuid)?.name;
          }
        });

        this.updateDataSource(this.numberLists);
      });
  }

  showDialog<T, D = any, R = any>(
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

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  onChangePage(page?: number) {
    console.log('page: ', page);
    if (page > -1) {
      this.pageable.page = page;
    }
    this.reload();
  }

  private getCampaignByUuid(uuid): CampaignLicenseInfo {
    return Object.assign(
      new CampaignLicenseInfo(),
      this.numberLists.find(x => x.uuid === uuid)
    );
  }

  private updateDataSource(data: CampaignLicenseInfo[]) {
    this.dataSource = new MatTableDataSource<CampaignLicenseInfo>(data);
  }
}
