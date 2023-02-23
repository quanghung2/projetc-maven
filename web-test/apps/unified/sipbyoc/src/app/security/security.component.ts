import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { SipAccount, SipTrunkQuery, SipTrunkService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss']
})
export class SecurityComponent extends DestroySubscriberComponent implements OnInit {
  sip: SipAccount;
  textInputCtrl = new FormControl();
  ipWhiteList: string[] = [];

  readonly displayedColumns = ['id', 'ip-address', 'actions'];

  constructor(
    private sipTrunkQuery: SipTrunkQuery,
    private sipTrunkService: SipTrunkService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.sipTrunkQuery
      .selectActive()
      .pipe(
        filter(x => x != null),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(sip => {
        this.sip = cloneDeep(sip);
        this.ipWhiteList = sip?.detail?.config?.ipWhiteList || [];
      });
  }

  addIp() {
    if (this.textInputCtrl.value) {
      this.sipTrunkService.addIpWhiteList(this.sip.sipUsername, [this.textInputCtrl.value]).subscribe(
        _ => {
          this.textInputCtrl.setValue('');
        },
        err => this.toastService.error('Cannot update your setting. Please check your input.')
      );
    }
  }

  deleteIpAddress(index: number) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `Delete ${this.ipWhiteList[index]}?`,
          message: 'Are you sure you want to delete this IP address?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        }
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.sipTrunkService.removeIpWhiteList(this.sip.sipUsername, this.ipWhiteList[index]).subscribe(
            _ => {},
            err => this.toastService.error(err.message)
          );
        }
      });
  }
}
