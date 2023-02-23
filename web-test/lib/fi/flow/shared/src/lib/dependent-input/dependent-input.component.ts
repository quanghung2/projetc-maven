import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import {
  AuthorDataSourceQuery,
  BodyParameter,
  ConfigStaticDataSource,
  DataSourceForSubroutine
} from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { map, takeUntil } from 'rxjs/operators';
import { AppName } from '../app-state/app-state.model';
import { AppStateQuery } from '../app-state/app-state.query';

interface DefineCondition {
  key: string;
  dataType: string;
  valueSource: string[] | number[] | ConfigStaticDataSource[];
}

class DataSourceInterface {
  uuid: string;
  staticValues: ConfigStaticDataSource[];

  constructor(obj?: Partial<DataSourceInterface>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

@Component({
  selector: 'b3n-dependent-input',
  templateUrl: './dependent-input.component.html',
  styleUrls: ['./dependent-input.component.scss']
})
export class DependentInputComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() myForm: UntypedFormGroup;
  @Input() parameters: BodyParameter[];
  @Input() dataSourcesInput: DataSourceForSubroutine[];
  @Input() allowEdit = true;

  showForApp: AppName;

  dataSources: DataSourceInterface[];
  keys: BodyParameter[];
  defineCondition: DefineCondition[] = [];

  get conditions(): UntypedFormArray {
    return this.myForm.get('visibilityDep.conditions') as UntypedFormArray;
  }

  constructor(
    private fb: UntypedFormBuilder,
    private appStateQuery: AppStateQuery,
    private authorDataSourceQuery: AuthorDataSourceQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
    if (!this.allowEdit) {
      this.conditions.disable();
    }

    switch (this.showForApp) {
      case AppName.FLOW:
        this.authorDataSourceQuery
          .selectAll({ filterBy: entity => entity.type === 'STATIC' })
          .pipe(
            takeUntil(this.destroySubscriber$),
            map(res =>
              res.map(d => new DataSourceInterface({ uuid: d.uuid, staticValues: <ConfigStaticDataSource[]>d.config }))
            )
          )
          .subscribe(data => {
            this.dataSources = data;
          });
        break;
      case AppName.BUSINESS_ACTION_CREATOR:
        this.dataSources = this.dataSourcesInput
          .filter(entity => entity.type === 'STATIC')
          .map(d => new DataSourceInterface({ uuid: d.uuid, staticValues: <ConfigStaticDataSource[]>d.staticValues }));
        break;
    }

    this.keys = this.parameters.filter(
      p => p.key !== this.myForm.value.key && (p.dataTypeFake === 'boolean' || this.isDataSource(p.dataTypeFake))
    );

    if (this.conditions) {
      this.initConditions();
      this.conditions.valueChanges.subscribe(() => {
        this.initConditions();
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['parameters'] && !changes['parameters'].firstChange) {
      this.keys = this.parameters.filter(
        p => p.key !== this.myForm.value.key && (p.dataTypeFake === 'boolean' || this.isDataSource(p.dataTypeFake))
      );

      if (this.keys.length == 0) {
        this.conditions?.clear();
      } else {
        const curDefineCondition = this.defineCondition.slice();
        for (let i = 0; i < curDefineCondition.length; i++) {
          if (!curDefineCondition[i]?.key) {
            continue;
          }
          const key = this.keys.find(k => k.key === curDefineCondition[i].key);
          if (key) {
            switch (curDefineCondition[i].dataType) {
              case 'boolean':
                if (key.dataTypeFake !== 'boolean') {
                  this.defineCondition.splice(i, 1);
                  this.conditions.removeAt(i);
                }
                break;
              default:
                if (curDefineCondition[i].dataType !== `valuelist - ${key.dataTypeFake}`) {
                  this.defineCondition.splice(i, 1);
                  this.conditions.removeAt(i);
                }
                break;
            }
          } else {
            this.defineCondition.splice(i, 1);
            this.conditions.removeAt(i);
          }
        }
      }
    }
  }

  private initConditions() {
    for (let i = 0; i < this.conditions.controls.length; i++) {
      if (this.conditions.value[i].key) {
        const param = this.parameters.find(p => p.key === this.conditions.value[i].key);
        let dataType = '';
        let valueSource = [];

        if (param.dataType === 'boolean') {
          dataType = 'boolean';
          valueSource = [];
        } else if (this.isDataSource(param.renderDirective.valueListUuid)) {
          dataType = `valuelist - ${param.renderDirective.valueListUuid}`;
          valueSource = <ConfigStaticDataSource[]>(
            this.dataSources.find(i => i.uuid === param.renderDirective.valueListUuid).staticValues
          );
        }

        this.defineCondition[i] = {
          key: this.conditions.value[i].key,
          dataType: dataType,
          valueSource: valueSource
        };
      } else {
        this.defineCondition[i] = {
          key: '',
          dataType: '',
          valueSource: []
        };
      }
    }
  }

  private isDataSource(uuid: string) {
    return !!this.dataSources.find(dts => dts.uuid === uuid);
  }

  private createFormCondition(): UntypedFormGroup {
    return this.fb.group({
      key: ['', Validators.required],
      values: [[], Validators.required]
    });
  }

  addCondition() {
    this.conditions.push(this.createFormCondition());
    this.myForm.get('require').disable();
    this.myForm.get('require').setValue(false);
    this.myForm.get('isOptional').setValue(true);
  }

  removeCondition(index: number) {
    this.conditions.removeAt(index);
    this.defineCondition.splice(index, 1);
    if (this.conditions.controls.length == 0) {
      this.myForm.get('require').enable();
    } else {
      this.myForm.get('require').disable();
      this.myForm.get('require').setValue(false);
      this.myForm.get('isOptional').setValue(true);
    }
  }

  existKey(key: string) {
    return this.conditions.value.some(p => p.key === key);
  }
}
