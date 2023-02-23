import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatSelect } from '@angular/material/select';
import { QueueInfo } from '@b3networks/api/callcenter';
import { DashboardV2Service, QuestionV2SourceFilter, QUEUE_WIDTH } from '@b3networks/api/dashboard';
import { DashboardV2AppSettingFilter } from '@b3networks/api/portal';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import { firstValueFrom } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-queue-filter',
  templateUrl: './queue-filter.component.html',
  styleUrls: ['./queue-filter.component.scss']
})
export class QueueFilterComponent extends DestroySubscriberComponent implements OnInit {
  @Input() form: UntypedFormGroup;
  @Input() selectAllQueue: boolean;
  @Input() storedFilter: DashboardV2AppSettingFilter;
  @Output() setSelectAllQueue = new EventEmitter<boolean>();
  @ViewChild('queueSelect') queueSelect: MatSelect;

  hasQueueFilterV2: boolean;
  fetchedQueue: boolean;
  allQueues: QueueInfo[] = [];
  allQueueUuids: string[] = [];

  constructor(private dashboardV2Service: DashboardV2Service, private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    this.handleQueuesFilter();
  }

  toggleSelectAllQueue(checked: boolean) {
    this.setSelectAllQueue.emit(checked);
    this.queues.setValue(checked ? this.allQueueUuids : []);
  }

  handleQueuesFilter() {
    this.dashboardV2Service.queueFilterHash$$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(async queueFilterHash => {
          if (
            !this.hasQueueFilterV2 &&
            !this.queues?.value?.length &&
            this.fetchedQueue &&
            this.allQueueUuids.length &&
            queueFilterHash
          ) {
            this.queues.setValue(this.allQueueUuids);
          }

          this.checkHasQueueFilterV2(queueFilterHash);

          if (this.hasQueueFilterV2 && !this.fetchedQueue) {
            this.fetchedQueue = true;
            this.dashboardV2Service.fetchQueue$.next(true);
            this.allQueues = await firstValueFrom(this.dashboardV2Service.allQueues$);
            this.queues.valueChanges
              .pipe(
                takeUntil(this.destroySubscriber$),
                tap(uuids => {
                  const queueSelectValue = this.queueSelect?.value;

                  if (uuids && queueSelectValue && uuids.length !== queueSelectValue.length) {
                    this.queues.setValue(uuids);
                    return;
                  }

                  this.setSelectAllQueue.emit(uuids?.length === this.allQueues.length);
                  const selectAllQueue = uuids?.length === this.allQueues.length;

                  if (!selectAllQueue && this.includeNonQueue.value && uuids?.length) {
                    this.includeNonQueue.setValue(false);
                  }

                  this.dashboardV2Service.queueUuids$.next(uuids);
                })
              )
              .subscribe();

            this.allQueueUuids = this.allQueues.map(q => q.uuid);
            this.queues.setValue(this.storedFilter?.queues ? this.storedFilter.queues : this.allQueueUuids);
          }
        })
      )
      .subscribe();
  }

  checkHasQueueFilterV2(queueFilterHash: HashMap<boolean>) {
    this.hasQueueFilterV2 = false;
    const keys = Object.keys(queueFilterHash);

    keys.every(uuid => {
      if (queueFilterHash[uuid]) {
        this.hasQueueFilterV2 = true;
        this.dashboardV2Service.setFiltersWidthHash(QuestionV2SourceFilter.QUEUE_UUID, QUEUE_WIDTH);
        return false;
      }

      return true;
    });

    this.cdr.detectChanges();
  }

  get queues() {
    return this.form?.controls['queues'];
  }

  get includeNonQueue() {
    return this.form?.controls['includeNonQueue'];
  }
}
