import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  AuthenticationMode,
  CallerIdOptionMode,
  SipAccount,
  SipTrunkQuery,
  SipTrunkService
} from '@b3networks/api/callcenter';
import { LicenseDevService } from '@b3networks/api/license';
import { DestroySubscriberComponent, donwloadFromUrl } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { filter, takeUntil, tap } from 'rxjs/operators';
import {
  sip1,
  sip1b3networks,
  sip2,
  sip2b3,
  sip3,
  sip3b3,
  sip5b3,
  sip6b3,
  sip8b3,
  sipbiz,
  sipmy,
  sipsg,
  siptestb3,
  siptls,
  siptrunk
} from '../shared';
import { EditTagComponent, EditTagInput } from './edit-tag/edit-tag.component';

@Component({
  selector: 'b3n-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent extends DestroySubscriberComponent implements OnInit {
  isLoading: boolean;
  ui = {
    subSipDomain: null,
    pbxConfig: <any>{}
  };
  sip: SipAccount;
  assignNumbers: string[] = [];

  readonly CallerIdOptionMode = CallerIdOptionMode;
  readonly AuthenticationMode = AuthenticationMode;

  constructor(
    private sipTrunkQuery: SipTrunkQuery,
    private sipTrunkService: SipTrunkService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private licenseDevService: LicenseDevService
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.sipTrunkQuery
      .selectActive()
      .pipe(
        filter(x => x != null),
        takeUntil(this.destroySubscriber$),
        tap(() => (this.isLoading = false))
      )
      .subscribe(sip => {
        this.sip = cloneDeep(sip);
        this.loadLabel(sip);
        this.licenseDevService
          .getAssignedNumbersBySubscriptionUuid(sip.detail.subscriptionUuid)
          .subscribe(assignNumbers => {
            this.assignNumbers = assignNumbers;
          });
      });
  }

  editSipLabel() {
    this.dialog.open(EditTagComponent, {
      data: <EditTagInput>{
        sip: this.sip
      },
      width: '400px',
      disableClose: true
    });
  }

  getTLSKey(sip: SipAccount) {
    this.sipTrunkService.getTLSKeyAccount(sip.sipUsername).subscribe(
      res => {
        donwloadFromUrl(res['keyUrl'], 'Certificate');
      },
      err => this.toastService.error('Cannot get tls certificate.')
    );
  }

  private loadLabel(sip: SipAccount) {
    if (sip.sipAccount.domain.indexOf('sip1') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip1b3networks;
      } else {
        this.ui.pbxConfig = sip1;
      }
      this.ui.subSipDomain = 'sip1';
    } else if (sip.sipAccount.domain.indexOf('sip2') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip2b3;
      } else {
        this.ui.pbxConfig = sip2;
      }
      this.ui.subSipDomain = 'sip2';
    } else if (sip.sipAccount.domain.indexOf('sip3') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip3b3;
      } else {
        this.ui.pbxConfig = sip3;
      }
      this.ui.subSipDomain = 'sip3';
    } else if (sip.sipAccount.domain.indexOf('sip5') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip5b3;
      }

      this.ui.subSipDomain = 'sip5';
    } else if (sip.sipAccount.domain.indexOf('sip6') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip6b3;
      }
      this.ui.subSipDomain = 'sip6';
    } else if (sip.sipAccount.domain.indexOf('sip8') === 0) {
      if (sip.sipAccount.domain.indexOf('b3networks') !== -1) {
        this.ui.pbxConfig = sip8b3;
      }
      this.ui.subSipDomain = 'sip8';
    } else if (sip.sipAccount.domain.indexOf('siptest') === 0) {
      this.ui.pbxConfig = siptestb3;
      this.ui.subSipDomain = 'siptest';
    } else if (sip.sipAccount.domain.indexOf('sipbiz') === 0) {
      this.ui.pbxConfig = sipbiz;
      this.ui.subSipDomain = 'sipbiz';
    } else if (sip.sipAccount.domain.indexOf('sipmy') === 0) {
      this.ui.pbxConfig = sipmy;
      this.ui.subSipDomain = 'sipmy';
    } else if (sip.sipAccount.domain.indexOf('sipsg') === 0) {
      this.ui.pbxConfig = sipsg;
      this.ui.subSipDomain = 'sipsg';
    } else if (sip.sipAccount.domain.indexOf('siptls') === 0) {
      this.ui.pbxConfig = siptls;
      this.ui.subSipDomain = 'siptls';
    } else if (sip.sipAccount.domain.indexOf('siptrunk') === 0) {
      this.ui.pbxConfig = siptrunk;
      this.ui.subSipDomain = 'siptrunk';
    }
  }
}
