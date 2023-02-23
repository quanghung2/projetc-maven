import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Organization, OrganizationService } from '@b3networks/api/auth';
import {
  ActionType,
  CallFlow,
  CallflowService,
  Rule,
  RuleDestination,
  ShiftData,
  SourceService,
  TimeRange,
  WeekDay,
  Workflow,
  WorkflowService
} from '@b3networks/api/ivr';
import { FindNumberReq, NumberService } from '@b3networks/api/number';
import { Subscription } from '@b3networks/api/subscription';
import { APP_IDS, USER_INFO, X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable, of } from 'rxjs';
import { finalize, mergeMap } from 'rxjs/operators';

export interface StoreWorkflowInput {
  workflow: Workflow;
  type: ActionType;
  updateLabelOnly: boolean;
  assignedSubscriptions: Subscription[];
}

class NumberInfo {
  subscriptionUuid: string;
  subscriptionName: string;
  numbers: string[];

  get description() {
    let name = this.subscriptionName.length > 0 ? this.subscriptionName : '';

    name += this.numbers.length > 0 ? ` (${this.numbers.join(', ')})` : '';

    return name.trim().length > 0 ? name : 'No assigned';
  }
}

@Component({
  selector: 'b3n-store-workflow',
  templateUrl: './store-workflow.component.html',
  styleUrls: ['./store-workflow.component.scss']
})
export class StoreWorkflowComponent implements OnInit {
  readonly workingDays = [WeekDay.MONDAY, WeekDay.TUESDAY, WeekDay.WEDNESDAY, WeekDay.THURSDAY, WeekDay.FRIDAY];
  readonly morningTimeRange = new TimeRange({ from: '9:00', to: '12:00' });
  readonly afternoonTimeRange = new TimeRange({ from: '13:00', to: '18:00' });
  readonly objectKeys = Object.keys;
  readonly ActionType = ActionType;

  type: ActionType;
  updateLabelOnly: boolean;

  organization: Organization;

  workflow = new Workflow();
  subscriptionMaping: { [Tkey in string]: NumberInfo } = {};

  selectedSubscriptionUuid: string;
  assignedSubscriptions: Subscription[];
  progressing: boolean;

  constructor(
    private dialogRef: MatDialogRef<StoreWorkflowComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreWorkflowInput,
    private workflowService: WorkflowService,
    private flowServices: CallflowService,
    private numberService: NumberService,
    private sourceService: SourceService,
    private orgService: OrganizationService,
    private spinner: LoadingSpinnerSerivce,
    private toastService: ToastService
  ) {
    this.workflow = new Workflow(data.workflow);
    this.type = data.type;
    this.updateLabelOnly = data.updateLabelOnly;
    this.assignedSubscriptions = data.assignedSubscriptions;
  }

  ngOnInit() {
    if (!this.updateLabelOnly) {
      this.spinner.showSpinner();

      this.orgService
        .getOrganizationByUuid(X.getContext()[USER_INFO.orgUuid])
        .pipe(
          mergeMap(org => {
            this.organization = org;

            const findNumberReq = new FindNumberReq();
            findNumberReq.appIds = [APP_IDS.VIRTUAL_LINE];
            findNumberReq.states = 'Assigned';

            return forkJoin([
              this.numberService.findNumbers(findNumberReq, { page: 1, perPage: 1000 }), // fetch numbers to get subscription uuid
              this.sourceService.fetchIvrSources() // fetch unasigned numbers
            ]).pipe(finalize(() => this.spinner.hideSpinner()));
          })
        )
        .subscribe(
          data => {
            const sourceMapping = data[1].reduce(function (map, source) {
              map[source.number] = source;
              return map;
            }, {});

            const numberMapping = data[0].content.reduce((map, num) => {
              if (num.number in sourceMapping || this.workflow.numbers.indexOf(num.number) > -1) {
                map[num.subscriptionUuid] = map[num.subscriptionUuid] || [];
                map[num.subscriptionUuid].push(num.number);
              }

              return map;
            }, {});

            this.subscriptionMaping = this.assignedSubscriptions.reduce(function (map, sub) {
              if (sub.uuid in numberMapping) {
                const numberInfo = new NumberInfo();
                numberInfo.subscriptionUuid = sub.uuid;
                numberInfo.subscriptionName = sub.subscriptionName;
                numberInfo.numbers = numberMapping[sub.uuid];

                map[sub.uuid] = numberInfo;
              }

              return map;
            }, {});

            if (this.type === 'create') {
              this.initWorkflow();
            } else if (this.workflow.numbers.length > 0) {
              const number = data[0].content.find(n => n.number === this.workflow.firstNumber);
              if (number) {
                this.selectedSubscriptionUuid = number.subscriptionUuid;
              }
            }
          },
          error => {
            this.toastService.error(error.message);
            this.dialogRef.close();
          }
        );
    }
  }

  progress() {
    this.progressing = true;

    of(this.type)
      .pipe(mergeMap(type => (type === 'create' ? this.create() : this.update())))
      .subscribe(
        flow => {
          this.dialogRef.close(flow);
          this.toastService.success(`${this.type === 'create' ? 'Created' : 'Updated'} flow successfully!`);
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  private create(): Observable<Workflow> {
    const strimmedLabel = this.workflow.label.trim().substring(0, 256 - 6);

    if (this.selectedSubscriptionUuid) {
      this.workflow.numbers = this.subscriptionMaping[this.selectedSubscriptionUuid].numbers;
    }
    return forkJoin([
      this.flowServices.createFlow(new CallFlow({ label: `${strimmedLabel} - OH` })),
      this.flowServices.createFlow(new CallFlow({ label: `${strimmedLabel} - AOH` })),
      this.flowServices.createFlow(new CallFlow({ label: `${strimmedLabel} - PH` }))
    ]).pipe(
      mergeMap(data => {
        this.workflow.rule.destinations = {
          officeHour: new RuleDestination({ uuid: data[0].uuid }),
          afterOfficeHour: new RuleDestination({ uuid: data[1].uuid }),
          publicHoliday: new RuleDestination({ uuid: data[2].uuid })
        };

        return this.workflowService.createWorkflow(this.workflow).pipe(finalize(() => (this.progressing = false)));
      })
    );
  }

  /**
   * Only update for label and numbers
   */
  private update(): Observable<Workflow> {
    const updateWorkflow = new Workflow({ label: this.workflow.label });
    if (this.updateLabelOnly) {
      return this.workflowService.updateWorkflow(this.workflow.uuid, updateWorkflow);
    }
    if (this.type === 'assign') {
      const numbers = this.subscriptionMaping[this.selectedSubscriptionUuid].numbers;
      return this.workflowService.assignNumbers(this.workflow.uuid, numbers);
    } else if (this.type === ActionType.unassign) {
      return this.workflowService.unassignNumbers(this.workflow.uuid);
    }
    return of();
    // return this.workflowService.updateWorkflow(this.workflow.uuid, updateWorkflow);
  }

  private initWorkflow() {
    const rule = new Rule();
    rule.holidayCode = this.organization.countryCode.toLowerCase();
    rule.shifts = this.workingDays.map(weekDay => {
      return new ShiftData({
        dayOfWeek: weekDay,
        timeRanges: [this.morningTimeRange, this.afternoonTimeRange]
      });
    });
    this.workflow = new Workflow({ label: 'Default flow' });
    this.workflow.rule = rule;
  }
}
