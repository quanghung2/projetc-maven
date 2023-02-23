import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import {
  ExecutionLogsService,
  Flow,
  FlowQuery,
  GetLogsReq,
  TestFlowService,
  TestInput,
  Trigger,
  TriggerService
} from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { filter, finalize, take, takeUntil, tap } from 'rxjs/operators';

export enum TriggerDefUuid {
  INCOMING_CALL = '5b444a98-49b3-4abd-bb36-1ea1f87ed71f'
}

@Component({
  selector: 'b3n-flow-testing',
  templateUrl: './flow-testing.component.html',
  styleUrls: ['./flow-testing.component.scss']
})
export class FlowTestingComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  flow: Flow;
  trigger: Trigger;
  TriggerDefUuid = TriggerDefUuid;
  formArrayInput: UntypedFormArray;
  numbers: string[];
  number: string;
  executing: boolean;
  executionId: number;
  gettingLogs: boolean;
  startTime: number;
  autoRefreshGetExecuteId;

  getErrorInput = (ctrl: UntypedFormControl | AbstractControl) => Utils.getErrorInput(ctrl);

  constructor(
    private fb: UntypedFormBuilder,
    private flowQuery: FlowQuery,
    private triggerService: TriggerService,
    private testFlowService: TestFlowService,
    private executionlogsService: ExecutionLogsService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.formArrayInput = this.fb.array([]);

    this.flowQuery
      .select()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(flow => Object.keys(flow).length > 0 && !!flow.uuid),
        take(1)
      )
      .subscribe(flow => {
        this.flow = flow;
        forkJoin([
          this.testFlowService
            .executeTestInputs(flow.uuid, flow.version)
            .pipe(tap(inputs => inputs.forEach(input => this.initInput(input)))),
          this.triggerService.getTrigger(flow.uuid, flow.version).pipe(
            tap(trigger => {
              this.trigger = trigger;
              if (trigger.def?.triggerDefUuid === TriggerDefUuid.INCOMING_CALL) {
                this.testFlowService
                  .getAvailableNumbers()
                  .pipe(tap(numbers => (this.numbers = numbers)))
                  .subscribe();
              }
            })
          )
        ]).subscribe();
      });
  }

  override ngOnDestroy(): void {
    clearInterval(this.autoRefreshGetExecuteId);
  }

  private initInput(item: TestInput) {
    let form;
    if (item.dataType === 'array') {
      form = this.fb.group({
        path: item.key,
        title: this.fb.control({ value: item.title, disabled: true }),
        dataType: this.fb.control({ value: item.dataType, disabled: true }),
        arrayItemDataType: this.fb.control({ value: item.arrayItemDataType, disabled: true }),
        arrayItemsSample: this.fb.control({ value: item.arrayItems, disabled: true }),
        arrayItems: this.fb.array([], Validators.required)
      });
    } else {
      form = this.fb.group({
        path: item.key,
        title: this.fb.control({ value: item.title, disabled: true }),
        dataType: this.fb.control({ value: item.dataType, disabled: true }),
        value: [
          null,
          Utils.validateInput({
            required: true,
            dataType: item.dataType,
            maxlength: ValidateStringMaxLength.USER_INPUT,
            max: ValidateNumberValue.MAX,
            min: ValidateNumberValue.MIN
          })
        ]
      });
      form.get('value').valueChanges.subscribe(value => {
        if (form.get('dataType').value === 'number') {
          form.get('value').setValue(Utils.convertValue(value, 'number'), { emitEvent: false });
        }
      });
    }
    this.formArrayInput.push(form);
  }

  private getLogs() {
    const req = <GetLogsReq>{
      nextCursor: null,
      size: 1,
      startTime: this.startTime,
      endTime: null,
      version: this.flow.version
    };
    forkJoin([
      this.executionlogsService.getExecutionLogsRunning(this.flow.uuid, req),
      this.executionlogsService.getExecutionLogsDone(this.flow.uuid, req)
    ]).subscribe(([logsRunning, logsDone]) => {
      if (logsRunning.data?.length > 0) {
        this.gettingLogs = false;
        clearInterval(this.autoRefreshGetExecuteId);
        this.executionId = logsRunning.data[0].id;
      } else if (logsDone.data?.length > 0) {
        this.gettingLogs = false;
        clearInterval(this.autoRefreshGetExecuteId);
        this.executionId = logsDone.data[0].id;
      }
    });
  }

  execute() {
    if (this.formArrayInput.valid) {
      this.executing = true;
      this.executionId = null;
      this.startTime = new Date().valueOf();
      if (this.trigger.def?.triggerDefUuid === TriggerDefUuid.INCOMING_CALL) {
        this.number = this.formArrayInput.value[0].value;
      }

      this.testFlowService
        .executeTest(this.flow.uuid, this.flow.version, this.formArrayInput.value)
        .pipe(finalize(() => (this.executing = false)))
        .subscribe({
          next: executionId => {
            if (executionId) {
              setTimeout(() => {
                this.executionId = executionId;
              }, 1000);
            } else {
              this.gettingLogs = true;
              this.autoRefreshGetExecuteId = setInterval(() => {
                this.getLogs();
              }, 5000);
            }
          },
          error: err => this.toastService.error(err.message)
        });
    }
  }
}
