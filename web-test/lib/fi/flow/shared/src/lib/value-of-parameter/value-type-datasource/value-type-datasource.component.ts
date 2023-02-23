import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import {
  AuthorDataSource,
  AuthorDataSourceQuery,
  ConfigStaticDataSource,
  DataSourceQuery,
  ExpressionTree,
  OptionForControl,
  OutputContextVariable
} from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { takeUntil } from 'rxjs/operators';
import { AppName } from '../../app-state/app-state.model';
import { AppStateQuery } from '../../app-state/app-state.query';

@Component({
  selector: 'b3n-value-type-datasource',
  templateUrl: './value-type-datasource.component.html',
  styleUrls: ['./value-type-datasource.component.scss']
})
export class ValueTypeDatasourceComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() optionForControl: OptionForControl;
  @Input() valueListUuid: string;
  @Output() expressionTree = new EventEmitter<OutputContextVariable>();

  showForApp: AppName;
  AppName = AppName;
  authorDataSource: AuthorDataSource;
  dataSource: ConfigStaticDataSource[];
  inputCtrl = new UntypedFormControl();
  nullValue: ConfigStaticDataSource = { label: '--- None ---', valueDataType: null, value: null };

  constructor(
    private appStateQuery: AppStateQuery,
    private dataSourceQuery: DataSourceQuery,
    private authorDataSourceQuery: AuthorDataSourceQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();

    let selectedValue: ConfigStaticDataSource;
    if (this.optionForControl.expressionTree) {
      selectedValue = (<ConfigStaticDataSource[]>this.authorDataSource.config).find(
        v => v.value === this.optionForControl.expressionTree.value
      );
    } else {
      selectedValue = this.nullValue;
    }
    this.inputCtrl.setValue(selectedValue);

    this.inputCtrl.valueChanges.subscribe((val: ConfigStaticDataSource) => {
      if (val.value) {
        const expressionTree = <ExpressionTree>{
          type: `value - ${val.valueDataType}`,
          value: val.value
        };
        this.expressionTree.emit({
          data: expressionTree,
          dataType: this.optionForControl.dataType
        });
      } else {
        this.expressionTree.emit({
          data: null
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['valueListUuid']) {
      switch (this.appStateQuery.getName()) {
        case AppName.FLOW:
          this.authorDataSource = this.authorDataSourceQuery.getEntity(this.valueListUuid);
          break;
        case AppName.BUSINESS_ACTION_CREATOR:
          this.dataSourceQuery
            .selectDataSource(this.valueListUuid)
            .pipe(takeUntil(this.destroySubscriber$))
            .subscribe(res => {
              this.dataSource = res;
            });
          break;
      }
    }
  }
}
