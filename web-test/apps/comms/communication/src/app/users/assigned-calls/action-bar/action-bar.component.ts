import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { KeyValue } from '@angular/common';
import { CommunicationAppSettings } from '@b3networks/api/portal';
import { Agent, AgentQuery, QueueInfo } from '@b3networks/api/callcenter';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { DestroySubscriberComponent } from '@b3networks/shared/common';

export interface IncomingFilterOption {
  key: string;
  value: string;
  tooltipMessage?: string;
}

@Component({
  selector: 'b3n-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent extends DestroySubscriberComponent implements OnInit {
  readonly typeOptions: KeyValue<string, string>[] = [
    { key: 'incoming', value: 'Incoming' },
    { key: 'callback', value: 'Callback' }
  ];
  readonly incomingResultOptions: IncomingFilterOption[] = [
    { key: 'answered', value: 'Answered' },
    { key: 'unanswered', value: 'Unanswered' },
    { key: 'unreachable', value: 'Unreachable' },
    { key: 'droppedByCaller', value: 'Dropped by Caller' }
  ];
  readonly callbackResultOptions: IncomingFilterOption[] = [
    { key: 'answered', value: 'Answered' },
    { key: 'unanswered', value: 'Unanswered' },
    { key: 'unreachable', value: 'Unreachable' }
  ];

  @Input() settings: CommunicationAppSettings;
  @Input() queues: QueueInfo[];
  @Input() agents: Agent[];
  @Input() fetching: boolean;
  @Input() isSupervisor: boolean;

  @Output() filterChanged = new EventEmitter<CommunicationAppSettings>();
  @Output() requestExport = new EventEmitter<boolean>();

  minDate = new Date();
  maxDate = new Date();
  selectAllQueues: boolean;
  selectAllAgent: boolean;
  selectAllResult: boolean;
  assignedCallForm: UntypedFormGroup;
  userOptions: KeyValue<string, string>[];
  resultOptions: IncomingFilterOption[];
  currentType: 'incoming' | 'callback';

  constructor(private fb: UntypedFormBuilder) {
    super();
  }

  get noQueueAndUserAndResultFiltered() {
    return (
      this.assignedCallForm.value?.queuesFiltering?.length === 0 ||
      this.assignedCallForm.value?.usersFiltering?.length === 0 ||
      this.assignedCallForm?.value?.resultFiltering?.length === 0
    );
  }

  get displayResultFiltered() {
    return this.assignedCallForm.value?.resultFiltering?.length > 0
      ? this.assignedCallForm.value?.resultFiltering
          ?.map(result => this.resultOptions?.find(r => r.key === result)?.value)
          ?.join(', ')
      : [];
  }

  initForm() {
    this.assignedCallForm = this.fb.group({
      type: [this.settings.assignedCall.type || 'incoming'],
      dateFiltering: this.fb.group({
        startDate: [
          this.settings.assignedCall?.dateFiltering?.startDate
            ? new Date(this.settings.assignedCall.dateFiltering.startDate)
            : new Date()
        ],
        endDate: [
          this.settings.assignedCall?.dateFiltering?.endDate
            ? new Date(this.settings.assignedCall.dateFiltering.endDate)
            : new Date()
        ]
      }),
      queuesFiltering: [this.settings.assignedCall?.queuesFiltering || []],
      usersFiltering: [this.settings.assignedCall?.usersFiltering || []],
      resultFiltering: [this.settings.assignedCall?.resultFiltering || []]
    });

    this.resultOptions =
      this.assignedCallForm.value.type === 'incoming' ? this.incomingResultOptions : this.callbackResultOptions;
    this.currentType = this.assignedCallForm.value.type;
    this.listenFilterChange();
  }

  updateQueueOptions() {
    this.selectAllQueues = this.assignedCallForm.value.queuesFiltering?.length === 0;
    if (this.selectAllQueues) {
      this.assignedCallForm.patchValue({ queuesFiltering: this.queues.map(q => q.uuid) }, { emitEvent: false });
    }
  }

  updateUserOptions() {
    this.selectAllAgent = this.settings.assignedCall.usersFiltering?.length === 0;
    if (this.selectAllAgent) {
      this.assignedCallForm?.patchValue({ usersFiltering: this.userOptions.map(a => a.key) }, { emitEvent: false });
    }
  }

  updateResultOptions() {
    this.selectAllResult = this.assignedCallForm.value.resultFiltering?.length === 0;
    if (this.selectAllResult) {
      this.assignedCallForm.patchValue({ resultFiltering: this.resultOptions.map(r => r.key) }, { emitEvent: false });
    }
  }

  listenFilterChange() {
    this.assignedCallForm.valueChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(value => {
      this.updateSelectAll(value);
      if (this.currentType !== value.type) {
        this.selectAllResult = true;
        value.resultFiltering = [];
        this.resultOptions = value.type === 'incoming' ? this.incomingResultOptions : this.callbackResultOptions;
        this.assignedCallForm.patchValue(
          { resultFiltering: this.resultOptions?.map(u => u.key) },
          { emitEvent: false }
        );
      }
      this.currentType = value.type;
      const settings = {
        ...this.settings,
        assignedCall: {
          type: value.type,
          dateFiltering: value.dateFiltering,
          queuesFiltering: this.noQueueAndUserAndResultFiltered
            ? 'No filtered'
            : value.queuesFiltering?.length === this.queues?.length
            ? []
            : value.queuesFiltering,
          usersFiltering: this.noQueueAndUserAndResultFiltered
            ? 'No filtered'
            : value.usersFiltering?.length === this.userOptions?.length
            ? []
            : value.usersFiltering,
          resultFiltering: this.noQueueAndUserAndResultFiltered
            ? 'No filtered'
            : value.resultFiltering?.length === this.resultOptions?.length
            ? []
            : value.resultFiltering
        }
      } as CommunicationAppSettings;

      this.filterChanged.emit(settings);
    });
  }

  updateSelectAll(formValue) {
    this.selectAllResult = this.resultOptions.length === formValue.resultFiltering.length;
    this.selectAllAgent = this.userOptions.length === formValue.usersFiltering.length;
    console.log(this.selectAllAgent);
    this.selectAllQueues = this.queues.length === formValue.queuesFiltering.length;
  }

  ngOnInit(): void {
    this.minDate.setDate(this.minDate.getDate() - 100);
    this.userOptions = this.agents?.map((agent: Agent) => {
      return { key: agent.identityUuid, value: agent.displayText };
    });
    this.initForm();
    this.updateQueueOptions();
    this.updateResultOptions();
    this.updateUserOptions();
  }

  compareCode(a: string, b: string) {
    return a && b && a === b;
  }

  toggleSelectAllQueue(checked: boolean) {
    this.selectAllQueues = checked;

    this.assignedCallForm.patchValue(
      { queuesFiltering: this.selectAllQueues ? this.queues?.map(q => q.uuid) : [] },
      { emitEvent: false }
    );

    this.filterChanged.emit({
      ...this.settings,
      assignedCall: {
        ...this.settings.assignedCall,
        queuesFiltering: this.noQueueAndUserAndResultFiltered ? 'No filtered' : []
      }
    });
  }

  toggleSelectAllAgent(checked: boolean) {
    this.selectAllAgent = checked;
    console.log(this.selectAllAgent);

    this.assignedCallForm.patchValue(
      { usersFiltering: this.selectAllAgent ? this.userOptions?.map(u => u.key) : [] },
      { emitEvent: false }
    );

    this.filterChanged.emit({
      ...this.settings,
      assignedCall: {
        ...this.settings.assignedCall,
        usersFiltering: this.noQueueAndUserAndResultFiltered ? 'No filtered' : []
      }
    });
  }

  toggleSelectAllResult(checked: boolean) {
    this.selectAllResult = checked;

    this.assignedCallForm.patchValue(
      { resultFiltering: this.selectAllResult ? this.resultOptions?.map(u => u.key) : [] },
      { emitEvent: false }
    );

    this.filterChanged.emit({
      ...this.settings,
      assignedCall: {
        ...this.settings.assignedCall,
        resultFiltering: this.noQueueAndUserAndResultFiltered ? 'No filtered' : []
      }
    });
  }

  export() {
    this.requestExport.emit(true);
  }

  refresh() {
    this.filterChanged.emit(this.settings);
  }
}
