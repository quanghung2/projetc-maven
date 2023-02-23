import { AfterContentChecked, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BaCreatorService,
  BaInputParams,
  ConfigStaticDataSource,
  DataSourceService,
  FlowActionReq,
  FunctionQuery,
  GetDataSourceReq,
  MapEventQuery,
  MappedEvent,
  MappedEventMapping,
  MappedEventTriggerDef,
  ReleaseGroup,
  RenderDirectiveType,
  SubTypeVariable,
  TriggerDef,
  TriggerDefQuery,
  TriggerDefService,
  VariableForAction
} from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { debounceTime, filter, finalize, startWith, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-config-event',
  templateUrl: './config-event.component.html',
  styleUrls: ['./config-event.component.scss']
})
export class ConfigEventComponent extends DestroySubscriberComponent implements OnInit, OnDestroy, AfterContentChecked {
  readonly RenderDirectiveType = RenderDirectiveType;

  param: FlowActionReq;
  id: number;
  isUpgrade: boolean;
  inputParams: BaInputParams[];
  contextVariables: VariableForAction[];
  dataSourceUuids: string[] = [];

  formMapEvent: UntypedFormGroup;
  submitting: boolean;

  mappedEvents: MappedEvent[];
  releaseGroups: ReleaseGroup[] = [];
  triggerDefs: TriggerDef[];
  filteredTriggerDefs: TriggerDef[];
  triggerCtrl = new UntypedFormControl('', Validators.required);
  searchTriggerCtrl = new UntypedFormControl();

  get releaseGroupId(): UntypedFormControl {
    return this.formMapEvent.get('releaseGroupId') as UntypedFormControl;
  }

  get mappings(): UntypedFormArray {
    return this.formMapEvent.get('mappings') as UntypedFormArray;
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private triggerDefService: TriggerDefService,
    private triggerDefQuery: TriggerDefQuery,
    private functionQuery: FunctionQuery,
    private dataSourceService: DataSourceService,
    private bacreatorService: BaCreatorService,
    private mapEventQuery: MapEventQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([this.route.params, this.route.queryParams]).subscribe(([params, queryParams]) => {
      this.param = {
        flowUuid: params['flowUuid'],
        version: Number(params['version'])
      };
      this.id = Number(params['id']); // id = 0: New, id > 0: Edit
      this.isUpgrade = !!queryParams['isUpgrade']; // is map new version

      this.formMapEvent = this.fb.group({
        baFlowUuid: params['flowUuid'],
        baFlowVersion: Number(params['version']),
        releaseGroupId: null,
        triggerDefUuid: ['', Validators.required],
        mappings: this.fb.array([])
      });

      this.bacreatorService.getInputParams(this.param).subscribe(inputs => {
        this.inputParams = inputs;
        if (this.id > 0) {
          this.mapEventQuery
            .select()
            .pipe(
              takeUntil(this.destroySubscriber$),
              filter(mapEvent => Object.keys(mapEvent).length > 0 && !!mapEvent.id)
            )
            .subscribe(mapEvent => {
              let triggerDef: MappedEventTriggerDef;
              if (this.isUpgrade) {
                triggerDef = mapEvent.latestTriggerDef ?? mapEvent.triggerDef;
                this.inputParams.forEach(i => {
                  const oldInput = mapEvent.mappings.find(m => m.actionDefInputKey == i.key);
                  if (oldInput) {
                    this.mappings.push(this.createFormGroup(i, oldInput));
                  } else {
                    this.mappings.push(this.createFormGroup(i));
                  }
                });
              } else {
                triggerDef = mapEvent.triggerDef;
                mapEvent.mappings.forEach(i => {
                  const oldInput: MappedEventMapping = {
                    actionDefInputKey: i.actionDefInputKey,
                    dataType: i.dataType,
                    userInputAllowed: i.userInputAllowed,
                    defaultValue: i.defaultValue
                  };
                  const renderDirective = this.inputParams.find(j => j.key === i.actionDefInputKey)?.renderDirective;
                  this.mappings.push(this.createFormGroup(<BaInputParams>{ renderDirective }, oldInput));
                });
              }
              this.formMapEvent.patchValue({ releaseGroupId: mapEvent.releaseGroupId });
              this.getContextVariables(triggerDef.uuid);
              this.fetchSelections();
            });
        } else {
          this.releaseGroupId.setValidators(Validators.required);
          this.bacreatorService.getReleaseGroups().subscribe(releaseGroups => {
            this.releaseGroups = releaseGroups;
          });
        }
      });
    });
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  override ngOnDestroy(): void {
    this.bacreatorService.resetMapEvent();
  }

  selectReleaseGroup() {
    this.triggerDefService.getAllTriggerDef('', this.releaseGroupId.value).subscribe();
    combineLatest([
      this.bacreatorService.getMappedEvents(this.param.flowUuid),
      this.triggerDefQuery.selectAll({ sortBy: 'displayName' }).pipe(takeUntil(this.destroySubscriber$))
    ]).subscribe(([mappedEvents, triggerDefs]) => {
      this.triggerDefs = triggerDefs.filter(t => !mappedEvents.find(m => m.latestTriggerDef.uuid === t.uuid));
      this.searchTriggerCtrl.valueChanges.pipe(debounceTime(200), startWith('')).subscribe(val => {
        this.filteredTriggerDefs = this.triggerDefs.filter(
          t => t.displayName?.toLowerCase().indexOf(val.toLowerCase()) >= 0
        );
      });
    });
  }

  selectTriggerDef() {
    this.getContextVariables(this.triggerCtrl.value.uuid);
    this.mappings.clear();
    this.inputParams.forEach(i => {
      this.mappings.push(this.createFormGroup(i));
    });
    this.fetchSelections();
  }

  private getContextVariables(triggerDefUuid: string) {
    this.formMapEvent.patchValue({ triggerDefUuid: triggerDefUuid });
    combineLatest([this.bacreatorService.getDynamicVars(triggerDefUuid), this.functionQuery.selectAll()])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([vars, functions]) => {
        vars.push(
          new VariableForAction({
            actionName: 'Function',
            functionVariable: functions,
            properties: []
          })
        );
        this.contextVariables = vars;
      });
  }

  private addDtsToArr(uuid: string) {
    if (!this.dataSourceUuids.find(dtsUuid => dtsUuid === uuid)) {
      this.dataSourceUuids.push(uuid);
    }
  }

  private fetchSelections() {
    const linkApi: Observable<ConfigStaticDataSource[]>[] = [];
    this.dataSourceUuids.forEach(uuid => {
      const request = <GetDataSourceReq>{
        dataSourceUuid: uuid,
        flowUuid: this.param.flowUuid,
        flowVersion: this.param.version
      };
      linkApi.push(this.dataSourceService.fetchSelections(request));
    });
    forkJoin(linkApi).subscribe();
  }

  private updateDefaultValue(form: UntypedFormGroup, userInputAllowed: boolean) {
    const defaultValueCtrl = form.get('defaultValue') as UntypedFormControl;
    defaultValueCtrl.setValidators(
      Utils.validateExp({
        required: !userInputAllowed,
        dataType: form.value.dataType,
        maxlength: ValidateStringMaxLength.USER_INPUT,
        max: ValidateNumberValue.MAX,
        min: ValidateNumberValue.MIN
      })
    );
    if (form.value.dataType === 'array') {
      defaultValueCtrl.setValue(userInputAllowed ? null : { type: SubTypeVariable.NullExp });
    }
    defaultValueCtrl.updateValueAndValidity();
  }

  private createFormGroup(i: BaInputParams, oldInput?: MappedEventMapping) {
    const form = this.fb.group({
      actionDefInputKey: oldInput ? oldInput.actionDefInputKey : i.key,
      dataType: oldInput ? oldInput.dataType : i.dataType,
      userInputAllowed: oldInput ? oldInput.userInputAllowed : false,
      defaultValue: oldInput ? oldInput.defaultValue : null,
      renderDirective: i.renderDirective
    });

    if (form.value.renderDirective?.valueListUuid) {
      this.addDtsToArr(form.value.renderDirective.valueListUuid);
    }

    this.updateDefaultValue(form, form.value.userInputAllowed);
    form.get('userInputAllowed').valueChanges.subscribe(checked => {
      this.updateDefaultValue(form, checked);
    });
    return form;
  }

  selectValueOfConfig(item: UntypedFormGroup, event) {
    delete event?.data?.label;
    item.get('defaultValue').setValue(event?.data);
  }

  submit() {
    if (this.formMapEvent.valid) {
      this.submitting = true;
      this.bacreatorService
        .setMappedEvent(this.formMapEvent.value)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: () => {
            this.toastService.success('Publish event successfully');
            this.router.navigate(
              ['../flow', this.formMapEvent.value.baFlowUuid, this.formMapEvent.value.baFlowVersion, 'mapped-events'],
              {
                relativeTo: this.route.parent
              }
            );
          },
          error: err => this.toastService.error(err.message)
        });
    }
  }
}
