import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { DashboardV2Service, INCLUDE_NON_QUEUE_WIDTH, QuestionV2SourceFilter } from '@b3networks/api/dashboard';
import { DashboardV2AppSettingFilter } from '@b3networks/api/portal';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-include-non-queue-filter',
  templateUrl: './include-non-queue-filter.component.html',
  styleUrls: ['./include-non-queue-filter.component.scss']
})
export class IncludeNonQueueFilterComponent extends DestroySubscriberComponent implements OnInit {
  @Input() form: UntypedFormGroup;
  @Input() storedFilter: DashboardV2AppSettingFilter;
  @Input() selectAllQueue: boolean;
  @ViewChild('includeNonQueueToggle') includeNonQueueToggle: MatSlideToggle;

  hasIncludeNonQueueV2: boolean;

  constructor(
    private dashboardV2Service: DashboardV2Service,
    private cdr: ChangeDetectorRef,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.handleIncludeNonQueueFilter();
    this.includeNonQueue.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        debounceTime(200),
        tap(includeNonQueue => {
          if (this.includeNonQueueToggle && includeNonQueue !== this.includeNonQueueToggle.checked) {
            this.includeNonQueue.setValue(includeNonQueue);
            return;
          }

          if (!this.selectAllQueue && includeNonQueue && this.queues.value?.length) {
            this.toastService.warning('Please select all queues or no queue');
            this.includeNonQueue.setValue(false);
            return;
          }

          this.dashboardV2Service.includeNonQueue$.next(includeNonQueue);
        })
      )
      .subscribe();

    this.includeNonQueue.setValue(
      typeof this.storedFilter?.includeNonQueue === 'boolean' ? this.storedFilter.includeNonQueue : true
    );
  }

  handleIncludeNonQueueFilter() {
    this.dashboardV2Service.includeNonQueueFilterHash$$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(includeNonQueueFilterHash => {
          this.checkHasIncludeNonQueueFilterV2(includeNonQueueFilterHash);
        })
      )
      .subscribe();
  }

  checkHasIncludeNonQueueFilterV2(includeNonQueueFilterHash: HashMap<boolean>) {
    this.hasIncludeNonQueueV2 = false;

    const keys = Object.keys(includeNonQueueFilterHash);

    keys.every(uuid => {
      if (includeNonQueueFilterHash[uuid]) {
        this.hasIncludeNonQueueV2 = true;
        this.dashboardV2Service.setFiltersWidthHash(QuestionV2SourceFilter.INCLUDE_NON_QUEUE, INCLUDE_NON_QUEUE_WIDTH);
        return false;
      }

      return true;
    });

    this.cdr.detectChanges();
  }

  get includeNonQueue() {
    return this.form?.controls['includeNonQueue'];
  }

  get queues() {
    return this.form?.controls['queues'];
  }
}
