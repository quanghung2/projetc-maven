import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CampaignLicenseInfo,
  CampaignLicenseService,
  CampaignTxnService,
  CampaignType
} from '@b3networks/api/callcenter';
import { CallType, EnumScope, SmsHistoryFilter, SmsStatus, SmsType, StatusCall } from '@b3networks/api/data';
import { UnifiedHistoryFilter } from '@b3networks/api/portal';
import { TimeRangeKey } from '@b3networks/shared/common';
import { addDays } from 'date-fns';
import { ROUTE_LINK } from '../../shared';

@Component({
  selector: 'b3n-report-campaign',
  templateUrl: './report-campaign.component.html',
  styleUrls: ['./report-campaign.component.scss']
})
export class ReportCampaignComponent implements OnInit {
  campaign: CampaignLicenseInfo;
  loading: boolean;

  readonly CampaignType = CampaignType;

  filterCall: UnifiedHistoryFilter = {
    teamUuid: EnumScope.org,
    timeRange: TimeRangeKey.specific_date,
    startDate: null,
    endDate: null,
    inputSearch: '',
    callType: CallType.all,
    status: StatusCall.all,
    campaignUuid: null
  };

  filterSMS: SmsHistoryFilter = {
    timeRange: TimeRangeKey.specific_date,
    startDate: null,
    endDate: null,
    inputSearch: '',
    type: SmsType.all,
    status: SmsStatus.all,
    campaignUuid: null
  };

  constructor(
    private campaignTxnService: CampaignTxnService,
    private actionRoute: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignLicenseService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loading = true;
    this.actionRoute.params.subscribe((param: any) => {
      const uuid = param?.numberListId;
      if (uuid) {
        this.campaignService.getCampaignV2(uuid).subscribe(data => {
          this.campaign = data;
          const start = new Date(data.createdAt);
          const end = addDays(start, 100);
          if (this.campaign.type === CampaignType.voice) {
            this.filterCall = {
              ...this.filterCall,
              campaignUuid: data.uuid,
              startDate: start,
              endDate: end
            };
          } else if (this.campaign.type === CampaignType.sms) {
            this.filterSMS = {
              ...this.filterSMS,
              campaignUuid: data.uuid,
              startDate: start,
              endDate: end
            };
          }

          this.loading = false;
        });
      }
    });
  }

  goBack() {
    this.router.navigate([ROUTE_LINK.campaign]);
  }
}
