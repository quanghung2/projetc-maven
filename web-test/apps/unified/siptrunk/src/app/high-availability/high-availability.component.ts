import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import {
  FailOverType,
  IncomingFailoverConfig,
  SipAccount,
  SipTrunkQuery,
  SipTrunkService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { Observable } from 'rxjs';
import { filter, finalize, map, takeUntil } from 'rxjs/operators';

enum FailOverEndpoint {
  auto = 'auto',
  manual = 'manual'
}

export interface BackupNumber {
  did: string;
  backup: string;
}

@Component({
  selector: 'b3n-high-availability',
  templateUrl: './high-availability.component.html',
  styleUrls: ['./high-availability.component.scss']
})
export class HighAvailabilityComponent extends DestroySubscriberComponent implements OnInit {
  selectFailOverCtrl = new UntypedFormControl();
  selectAccountCtrl = new UntypedFormControl();
  sip: SipAccount;
  accounts$: Observable<SipAccount[]>;
  progressing: boolean;
  active: boolean;
  backupNumbers: BackupNumber[] = [];
  customize: boolean;
  defaultBackupNumber: string;
  dataSource = new MatTableDataSource<BackupNumber>();

  readonly columns = ['did-number', 'backup-number', 'actions'];
  readonly FailOverEndpoint = FailOverEndpoint;
  readonly failOverOpts: KeyValue<string, string>[] = [
    { key: FailOverEndpoint.auto, value: 'Auto' },
    { key: FailOverEndpoint.manual, value: 'Manual' }
  ];

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

        this.selectFailOverCtrl.setValue(
          this.sip?.incomingFailoverConfig?.strategy === FailOverType.backupNumber
            ? FailOverEndpoint.manual
            : FailOverEndpoint.auto
        );

        // manual
        this.active = this.sip.incomingFailoverConfig?.active;
        this.backupNumbers = [];
        if (this.active) {
          Object.keys(this.sip?.incomingFailoverConfig?.backupNumbers || []).forEach(key => {
            this.backupNumbers.push({
              did: key,
              backup: this.sip?.incomingFailoverConfig?.backupNumbers[key]
            });
          });

          if (this.backupNumbers.length === 0) {
            this.backupNumbers.push({ did: '', backup: '' });
          }
        }
        this.defaultBackupNumber = this.sip.incomingFailoverConfig?.defaultBackupNumber;
        this.dataSource = new MatTableDataSource(this.backupNumbers);

        // auto
        const sip2nd = this.sipTrunkQuery.getEntity(this.sip.incomingFailoverConfig?.sipUsername);
        if (sip2nd) {
          this.selectAccountCtrl.setValue(sip2nd);
        }

        this.accounts$ = this.sipTrunkQuery
          .selectAll()
          .pipe(map(sips => sips.filter(item => item.sipUsername !== this.sip.sipUsername)));
      });
  }

  compareObjects(o1: SipAccount, o2: SipAccount) {
    return o1.sipUsername === o2.sipUsername;
  }

  removeBackupNumber(index: number) {
    this.backupNumbers.splice(index, 1);
    if (this.backupNumbers.length === 0) {
      this.customize = false;
    }
    this.dataSource = new MatTableDataSource(this.backupNumbers);
  }

  addBackupNumber() {
    this.backupNumbers.push({ did: '', backup: '' });
    this.dataSource = new MatTableDataSource(this.backupNumbers);
  }

  customizeIt() {
    this.backupNumbers = [];
    this.sip?.numbers?.forEach(did => {
      this.backupNumbers.push({ did: did, backup: '' });
    });

    if (this.backupNumbers.length === 0) {
      this.backupNumbers.push({ did: '', backup: '' });
    }
    this.dataSource = new MatTableDataSource(this.backupNumbers);
    this.customize = true;
  }

  onSave() {
    const req: Partial<SipAccount> = {
      incomingFailoverConfig: <IncomingFailoverConfig>{}
    };
    if (this.selectFailOverCtrl.value === FailOverEndpoint.auto) {
      const sip = this.sipTrunkQuery.getEntity(this.selectAccountCtrl.value?.sipUsername);
      if (sip) {
        req.incomingFailoverConfig = {
          strategy: FailOverType.sipEndpoint,
          sipUsername: sip.sipUsername,
          sipDomain: sip.sipAccount.domain
        };
      }
    } else if (this.selectFailOverCtrl.value === FailOverEndpoint.manual) {
      if (this.active) {
        const params = {};
        this.backupNumbers.forEach(backupNumber => {
          if (!!backupNumber.did && !!backupNumber.backup) {
            params[backupNumber.did] = backupNumber.backup;
          }
        });

        req.incomingFailoverConfig = {
          strategy: FailOverType.backupNumber,
          active: true,
          defaultBackupNumber: this.defaultBackupNumber,
          backupNumbers: params
        };
      } else {
        req.incomingFailoverConfig = {
          strategy: FailOverType.backupNumber,
          active: false,
          defaultBackupNumber: this.defaultBackupNumber,
          backupNumbers: null
        };
      }
    }
    if (Object.keys(req?.incomingFailoverConfig)?.length > 0) {
      this.progressing = true;
      this.sipTrunkService
        .updateAccountSipTrunk(this.sip.sipUsername, req)
        .pipe(finalize(() => (this.progressing = false)))
        .subscribe(
          _ => {
            this.toastService.success('Update successfully.');
          },
          err => this.toastService.error(err.message)
        );
    }
  }
}
