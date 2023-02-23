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
    { key: 'abandoned', value: 'Abandoned', tooltipMessage: 'May not involved user' },
    { key: 'shortAbandoned', value: 'Short Call', tooltipMessage: 'May not involved user' },
    { key: 'callbackRequest', value: 'Callback Request', tooltipMessage: 'May not involved user' },
    { key: 'voicemailRequest', value: 'Voicemail', tooltipMessage: 'No user involved' },
    { key: 'overflowHangup', value: 'Overflow Hang Up', tooltipMessage: 'No user involved' },
    { key: 'overflowCallbackSuccess', value: 'Overflow Callback Offer Accepted', tooltipMessage: 'No user involved' },
    { key: 'overflowCallbackFailed', value: 'Overflow Callback Offer Rejected', tooltipMessage: 'No user involved' },
    { key: 'unreachable', value: 'Users Unreachable' }
  ];
  readonly callbackResultOptions: IncomingFilterOption[] = [
    { key: 'answered', value: 'Success' },
    { key: 'customerUnanswered', value: 'Customer Unanswered' },
    { key: 'agentUnanswered', value: 'Users Unanswered' },
    { key: 'agentUnreachable', value: 'Users Unreachable' },
    { key: 'expired', value: 'Request Expired' },
    { key: 'rejoined', value: 'Customer Rejoined Queue' }
  ];

  @Input() settings: CommunicationAppSettings;
  @Input() queues: QueueInfo[];
  @Input() fetching: boolean;

  @Output() filterChanged = new EventEmitter<CommunicationAppSettings>();
  @Output() requestExport = new EventEmitter<boolean>();

  minDate = new Date();
  maxDate = new Date();
  selectAllQueues: boolean;
  selectAllAgent: boolean;
  selectAllResult: boolean;
  completedForm: UntypedFormGroup;
  userOptions: KeyValue<string, string>[];
  resultOptions: IncomingFilterOption[];
  currentType: 'incoming' | 'callback';

  constructor(private fb: UntypedFormBuilder, private agentQuery: AgentQuery) {
    super();
  }

  get noQueueAndUserAndResultFiltered() {
    return (
      this.completedForm.value?.queuesFiltering?.length === 0 ||
      this.completedForm.value?.usersFiltering?.length === 0 ||
      this.completedForm?.value?.resultFiltering?.length === 0
    );
  }

  get displayResultFiltered() {
    return this.completedForm.value?.resultFiltering?.length > 0 &&
      this.completedForm.value?.resultFiltering !== 'No filtered'
      ? this.completedForm.value?.resultFiltering
          ?.map(result => this.resultOptions?.find(r => r.key === result)?.value)
          ?.join(', ')
      : [];
  }

  initForm() {
    this.completedForm = this.fb.group({
      type: [this.settings.completedCall.type || 'incoming'],
      dateFiltering: this.fb.group({
        startDate: [
          this.settings.completedCall?.dateFiltering?.startDate
            ? new Date(this.settings.completedCall.dateFiltering.startDate)
            : new Date()
        ],
        endDate: [
          this.settings.completedCall?.dateFiltering?.endDate
            ? new Date(this.settings.completedCall.dateFiltering.endDate)
            : new Date()
        ]
      }),
      queuesFiltering: [this.settings.completedCall?.queuesFiltering || []],
      usersFiltering: [this.settings.completedCall?.usersFiltering || []],
      resultFiltering: [this.settings.completedCall?.resultFiltering || []]
    });

    this.resultOptions =
      this.completedForm.value.type === 'incoming' ? this.incomingResultOptions : this.callbackResultOptions;
    this.currentType = this.completedForm.value.type;
    this.listenFilterChange();
  }

  updateQueueOptions() {
    this.selectAllQueues = this.completedForm.value.queuesFiltering?.length === 0;
    if (this.selectAllQueues) {
      this.completedForm.patchValue({ queuesFiltering: this.queues.map(q => q.uuid) }, { emitEvent: false });
    }
  }

  updateUserOptions() {
    this.selectAllAgent = this.completedForm.value.usersFiltering?.length === 0;
    if (this.selectAllAgent) {
      this.completedForm.patchValue({ usersFiltering: this.userOptions.map(a => a.key) }, { emitEvent: false });
    }
  }

  updateResultOptions() {
    this.selectAllResult = this.completedForm.value.resultFiltering?.length === 0;
    if (this.selectAllResult) {
      this.completedForm.patchValue({ resultFiltering: this.resultOptions.map(r => r.key) }, { emitEvent: false });
    }
  }

  listenFilterChange() {
    this.completedForm.valueChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(value => {
      this.updateSelectAll(value);
      if (this.currentType !== value.type) {
        this.selectAllResult = true;
        value.resultFiltering = [];
        this.resultOptions = value.type === 'incoming' ? this.incomingResultOptions : this.callbackResultOptions;
        this.completedForm.patchValue({ resultFiltering: this.resultOptions?.map(u => u.key) }, { emitEvent: false });
      }
      this.currentType = value.type;
      const settings = {
        ...this.settings,
        completedCall: {
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
    this.selectAllQueues = this.queues.length === formValue.queuesFiltering.length;
  }

  ngOnInit(): void {
    this.minDate.setDate(this.minDate.getDate() - 100);
    this.userOptions = this.agentQuery.getAllAgents().map((agent: Agent) => {
      return { key: agent.identityUuid, value: agent.displayText };
    });
    this.initForm();
    this.updateQueueOptions();
    this.updateUserOptions();
    this.updateResultOptions();
  }

  compareCode(a: string, b: string) {
    return a && b && a === b;
  }

  toggleSelectAllQueue(checked: boolean) {
    this.selectAllQueues = checked;

    this.completedForm.patchValue(
      { queuesFiltering: this.selectAllQueues ? this.queues?.map(q => q.uuid) : [] },
      { emitEvent: false }
    );

    this.filterChanged.emit({
      ...this.settings,
      completedCall: {
        ...this.settings.completedCall,
        queuesFiltering: this.noQueueAndUserAndResultFiltered ? 'No filtered' : []
      }
    });
  }

  toggleSelectAllAgent(checked: boolean) {
    this.selectAllAgent = checked;

    this.completedForm.patchValue(
      { usersFiltering: this.selectAllAgent ? this.userOptions?.map(u => u.key) : [] },
      { emitEvent: false }
    );

    this.filterChanged.emit({
      ...this.settings,
      completedCall: {
        ...this.settings.completedCall,
        usersFiltering: this.noQueueAndUserAndResultFiltered ? 'No filtered' : []
      }
    });
  }

  toggleSelectAllResult(checked: boolean) {
    this.selectAllResult = checked;

    this.completedForm.patchValue(
      { resultFiltering: this.selectAllResult ? this.resultOptions?.map(u => u.key) : [] },
      { emitEvent: false }
    );

    this.filterChanged.emit({
      ...this.settings,
      completedCall: {
        ...this.settings.completedCall,
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
