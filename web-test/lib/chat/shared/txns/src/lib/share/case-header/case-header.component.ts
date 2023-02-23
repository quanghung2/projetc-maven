import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MeQuery as MeCCQuery } from '@b3networks/api/callcenter';
import { Contact } from '@b3networks/api/contact';
import { PersonalSettingsQuery, PersonalSettingsService, UnifiedWorkspaceSetting } from '@b3networks/api/portal';
import { ConversationGroupQuery, MeQuery } from '@b3networks/api/workspace';
import {
  AppQuery,
  AppService,
  InviteMemberCaseComponent,
  ModeSidebar,
  Txn,
  TxnService
} from '@b3networks/chat/shared/core';
import { APP_IDS, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'b3n-case-header',
  templateUrl: './case-header.component.html',
  styleUrls: ['./case-header.component.scss']
})
export class CaseHeaderComponent implements OnInit, OnChanges {
  @Input() txns: Txn[];
  @Input() contact: Contact;

  hasPermissionTagCase: boolean;
  isMember: boolean;
  toggleInfoBtn$: Observable<boolean>;

  constructor(
    private personalSettingsQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private dialog: MatDialog,
    private meQuery: MeQuery,
    private meCCQuery: MeCCQuery,
    private convoGroupQuery: ConversationGroupQuery,
    private txnService: TxnService,
    private toastService: ToastService,
    private appQuery: AppQuery,
    private appService: AppService
  ) {}

  ngOnInit(): void {
    this.toggleInfoBtn$ = this.appQuery.modeRightSidebar$.pipe(
      switchMap(mode =>
        mode === ModeSidebar.side
          ? this.personalSettingsQuery
              .selectAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
              .pipe(map(result => (result as UnifiedWorkspaceSetting)?.showRightSidebar))
          : this.appQuery.showRightSidebar$
      )
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['txns'] && this.txns) {
      const me = this.meQuery.getMe();
      if (this.txns.length > 0) {
        this.isMember = this.txns[this.txns.length - 1]?.lastAssignedAgents?.findIndex(x => x === me.identityUuid) > -1;
      }
      this.hasPermissionTagCase =
        this.meCCQuery.isSupervisor() || this.txns?.some(txn => txn.lastAssignedAgents?.indexOf(me.identityUuid) > -1);
    }
  }

  closeTransaction() {
    let listTxn = this.txns;
    const me = this.meQuery.getMe();
    const isSuperviser = this.meCCQuery.isSupervisor();
    if (!isSuperviser) {
      listTxn = listTxn.filter(txn => txn?.lastAssignedAgents?.indexOf(me.identityUuid) > -1);
    }

    if (listTxn.length > 0) {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '50rem',
          data: <ConfirmDialogInput>{
            title: 'Close transaction',
            message: 'Are you sure you want to close this livechat?',
            cancelLabel: 'No',
            confirmLabel: 'Yes'
          }
        })
        .afterClosed()
        .subscribe(
          res => {
            if (res) {
              if (this.txns[0]?.inboxUuid) {
                this.txnService
                  .endTxnsV2(listTxn.map(x => x.txnUuid))
                  .subscribe(_ => this.toastService.success('Close transaction successfully'));
              } else {
                this.txnService
                  .endTxns(listTxn.map(x => x.txnUuid))
                  .subscribe(_ => this.toastService.success('Close transaction successfully'));
              }
            }
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    }
  }

  toggleRightSidebar() {
    this.updateSideBarSettings(null);
  }

  private updateSideBarSettings(isShow: boolean) {
    const mode = this.appQuery.getValue()?.modeRightSidebar;
    if (mode === ModeSidebar.side) {
      const settings = <UnifiedWorkspaceSetting>(
        this.personalSettingsQuery.getAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
      );
      if (settings) {
        if (isShow === null) {
          // toggle
          settings.showRightSidebar = !settings.showRightSidebar;
          this.personalSettingService.updateAppSettings(settings).subscribe();
        } else {
          if (settings.showRightSidebar !== isShow) {
            settings.showRightSidebar = isShow;
            this.personalSettingService.updateAppSettings(settings).subscribe();
          }
        }
      } else {
        setTimeout(() => {
          this.updateSideBarSettings(isShow);
        }, 100);
      }
    } else if (mode === ModeSidebar.over) {
      // toggle
      this.appService.update({
        showRightSidebar: !this.appQuery.getValue()?.showRightSidebar
      });
    }
  }

  joinConvoWhatsapp() {
    const convo = this.convoGroupQuery.getConvo(this.txns[this.txns.length - 1].txnUuid);
    this.dialog.open(InviteMemberCaseComponent, {
      width: '600px',
      data: { convo: convo, txn: this.txns[this.txns.length - 1] }
    });
  }
}
