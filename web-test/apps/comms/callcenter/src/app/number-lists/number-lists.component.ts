import { ComponentType } from '@angular/cdk/portal';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  CampaignInfo,
  CampaignService,
  FindCampaignReq,
  QueueInfo,
  QueueService,
  Status
} from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { FindSubscriptionReq, Subscription, SubscriptionService } from '@b3networks/api/subscription';
import { OrderBy, SortUtils } from '@b3networks/comms/callcenter/shared';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ConfirmChangeStatusComponent } from './confirm-change-stt/confirm-change-stt.component';
import { DeleteNumberListComponent } from './delete-number-list/delete-number-list.component';
import { DuplicateNumberListsDialogComponent } from './duplicate-number-list-dialog/duplicate-number-list-dialog.component';
import { StoreNumberListComponent, StoreNumberListData } from './store-number-list/store-number-list.component';

@Component({
  selector: 'b3n-workspace-number-lists',
  templateUrl: './number-lists.component.html',
  styleUrls: ['./number-lists.component.scss']
})
export class NumberListsComponent implements OnInit {
  findCampaignReq = new FindCampaignReq();
  queues: QueueInfo[];
  loading = false;
  numberLists: CampaignInfo[];
  displayedColumns: string[] = ['uuid', 'name', 'queue', 'number-count', 'status', 'actions'];
  numberListStatus = Status;
  globalDncSubs: Subscription[];
  isMore: boolean;
  pageable: Pageable = new Pageable(1, 10);

  constructor(
    private dialog: MatDialog,
    private campaignService: CampaignService,
    private queueService: QueueService,
    private spinnerService: LoadingSpinnerSerivce,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    const queuesStream = this.queueService.loadQueueList();
    const subscriptionStream = this.subscriptionService.findSubscriptions(
      Object.assign(new FindSubscriptionReq(), { productIds: [environment.globalDncAppId] })
    );

    this.spinnerService.showSpinner();
    forkJoin([queuesStream, subscriptionStream])
      .pipe(
        finalize(() => {
          this.spinnerService.hideSpinner();
          this.loading = false;
        })
      )
      .subscribe(res => {
        this.reload();
        this.queues = res[0];
        this.globalDncSubs = res[1].data;
      });
  }

  mapQueues(queueId: string) {
    if (queueId === null) {
      return '';
    } else {
      for (const queue of this.queues) {
        if (queue.uuid === queueId) {
          return queue.label;
        }
      }
      return '';
    }
  }

  create(uuid?: string) {
    const dialogRef = this.dialog.open(StoreNumberListComponent, {
      data: <StoreNumberListData>{ globalDncSubs: this.globalDncSubs },
      width: '600px',
      maxHeight: '700px'
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.reload();
      }
    });
  }

  edit(uuid) {
    this.showDialog(
      StoreNumberListComponent,
      <StoreNumberListData>{
        numberListData: this.getCampaignByUuid(uuid),
        globalDncSubs: this.globalDncSubs
      },
      true,
      { width: '600px', maxHeight: '700px' }
    );
  }

  changeNumberListStt(numberList: CampaignInfo) {
    this.showDialog(ConfirmChangeStatusComponent, numberList);
  }

  duplicate(uuid) {
    this.showDialog(DuplicateNumberListsDialogComponent, {
      numberListInfo: this.getCampaignByUuid(uuid)
    });
  }

  delete(uuid) {
    this.showDialog(DeleteNumberListComponent, this.getCampaignByUuid(uuid));
  }

  getCampaignByUuid(uuid): CampaignInfo {
    for (const numberList of this.numberLists) {
      if (numberList.uuid === uuid) {
        return numberList;
      }
    }
    return null;
  }

  reload() {
    this.spinnerService.showSpinner();

    forkJoin(
      this.campaignService.findCampaignsPage(this.findCampaignReq, this.pageable).pipe(
        finalize(() => {
          this.spinnerService.hideSpinner();
        })
      ),
      this.campaignService
        .findCampaignsPage(this.findCampaignReq, new Pageable(this.pageable.page + 1, this.pageable.perPage))
        .pipe(
          finalize(() => {
            this.spinnerService.hideSpinner();
          })
        )
    ).subscribe(data => {
      this.numberLists = SortUtils.sortBy(data[0].content, 'updatedAt', OrderBy.DESC);
      this.numberLists.map(numberList => {
        numberList.queueLable = this.mapQueues(numberList.queueUuid);
      });
      this.numberLists.forEach(numberData => {
        numberData.listScheduledAt ? (numberData.listScheduledAt = this.formatDate(numberData.listScheduledAt)) : [];
      });
      this.isMore = data[1].content.length > 0 ? true : false;
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

  numberManagement(uuid: string) {
    this.router.navigate([`/number-lists/${uuid}`]);
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  onChangePage(page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.reload();
  }
  formatDate(listScheduleAt) {
    let res = [];
    listScheduleAt.forEach(schedule => {
      schedule = format(new Date(schedule), 'yyyy-MM-dd');
      res.push(schedule);
    });
    return res;
  }

  // deleteAllOfCampaign() {
  //   this.numberLists.forEach(numberList => {
  //     this.campaignService.deleteCampaign(numberList.uuid).subscribe(data => {
  //       console.log(data);
  //     });
  //   });
  // }
}
