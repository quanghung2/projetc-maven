import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { RoutingConfigSip, SipAccount, SipTrunkQuery, SipTrunkService } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { ReportUploadComponent, ReportUploadData } from './report-upload/report-upload.component';
import {
  StoreIncomingSettingComponent,
  StoreIncomingSettingData
} from './store-incoming-setting/store-incoming-setting.component';
import { InfoCSV } from './upload-bulk-routing/upload-bulk-routing.component';

@Component({
  selector: 'b3n-incoming',
  templateUrl: './incoming.component.html',
  styleUrls: ['./incoming.component.scss']
})
export class IncomingComponent extends DestroySubscriberComponent implements OnInit {
  sip: SipAccount;
  textInputCtrl = new FormControl();
  ipWhiteList: string[] = [];
  searchTextCtr = new FormControl();
  searching: boolean;
  pageable: Pageable = <Pageable>{ page: 1, perPage: 10 };
  totalCount: number = 0;

  rules: RoutingConfigSip[] = [];
  readonly displayedColumns = ['rule', 'forwardTo', 'actions'];

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
        this.onFilterChanged();
      });

    this.searchTextCtr.valueChanges.pipe(debounceTime(300)).subscribe(value => {
      this.pageable.page = 1;
      this.onFilterChanged();
    });
  }

  onReported($event: InfoCSV[]) {
    this.dialog
      .open(ReportUploadComponent, {
        data: <ReportUploadData>{
          result: $event,
          sip: this.sip
        },
        disableClose: true,
        width: '400px'
      })
      .afterClosed()
      .subscribe(() => {
        this.onFilterChanged();
      });
  }

  create() {
    this.dialog
      .open(StoreIncomingSettingComponent, {
        data: <StoreIncomingSettingData>{
          isCreate: true,
          sip: this.sip
        },
        width: '650px',
        disableClose: true
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.onFilterChanged();
        }
      });
  }

  edit(item: RoutingConfigSip) {}

  delete(item: RoutingConfigSip) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete number',
          message: `Are you sure to delete this number?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.sipTrunkService.deleteRoutingConfig(this.sip.sipUsername, item.number).subscribe(
            _ => {
              this.onFilterChanged();
              this.toastService.success('Deleted successfully!');
            },
            err => this.toastService.error(err.message)
          );
        }
      });
  }

  onFilterChanged() {
    this.sipTrunkService
      .getRoutingConfig(this.sip.sipUsername, this.searchTextCtr.value?.trim(), this.pageable)
      .subscribe(response => {
        this.totalCount = response.totalCount;
        this.rules = response.content;
      });
  }

  onChangePage(page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }

    this.onFilterChanged();
  }
}
