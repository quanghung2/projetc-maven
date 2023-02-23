import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { FileService, S3Service, Status } from '@b3networks/api/file';
import {
  ConfigStaticDataSource,
  DataSourceQuery,
  ExpressionTree,
  OptionForControl,
  OutputContextVariable,
  RenderDirective,
  RenderDirectiveType,
  SubTypeVariable,
  VariableForAction
} from '@b3networks/api/flow';
import { ReqValidate, Utils } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent, donwloadFromUrl } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-render-directive',
  templateUrl: './render-directive.component.html',
  styleUrls: ['./render-directive.component.scss']
})
export class RenderDirectiveComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() optionForControl: OptionForControl;
  @Input() contextVariables: VariableForAction[];
  @Input() renderDirective: RenderDirective;
  @Input() typeBooleanCheckbox: boolean;
  @Input() reqValidate: ReqValidate;
  @Output() expressionTree = new EventEmitter<OutputContextVariable>();

  dataSources: ConfigStaticDataSource[] = [];
  renderDirectiveType = RenderDirectiveType;

  // for file
  uploading: boolean;

  // for single select | suggestive single select | radio list
  valueCtrl = new UntypedFormControl();

  // for array single select
  formArrayValues = new UntypedFormArray([]);

  // for array checkbox
  values: ConfigStaticDataSource[];

  constructor(
    private fb: UntypedFormBuilder,
    private dataSourceQuery: DataSourceQuery,
    private s3Service: S3Service,
    private fileService: FileService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['optionForControl']) {
      if (changes['optionForControl'].previousValue?.dataType !== this.optionForControl.dataType) {
        if (this.optionForControl.dataType === 'boolean') {
          if (this.typeBooleanCheckbox) {
            this.dataSources.length = 0;
          } else {
            this.dataSources = [
              { value: 'true', valueDataType: 'boolean', label: 'True' },
              { value: 'false', valueDataType: 'boolean', label: 'False' }
            ];
          }
          this.init();
        } else {
          if (this.renderDirective?.valueListUuid) {
            this.dataSourceQuery
              .selectDataSource(this.renderDirective.valueListUuid)
              .pipe(
                takeUntil(this.destroySubscriber$),
                filter(dts => dts !== undefined)
              )
              .subscribe(dts => {
                this.dataSources = dts;
                this.init();
              });
          }
        }
      }
    }
  }

  ngOnInit(): void {
    this.valueCtrl.valueChanges.subscribe(val => {
      const expressionTree = <ExpressionTree>{
        type: `value - ${this.optionForControl.dataType}`,
        value: Utils.convertValue(val, this.optionForControl.dataType)
      };
      this.expressionTree.emit({
        data: expressionTree,
        dataType: this.optionForControl.dataType
      });
    });
  }

  private init() {
    const exp = this.optionForControl.expressionTree;

    if (exp) {
      if (this.optionForControl.dataType !== 'array') {
        switch (this.renderDirective.type) {
          case RenderDirectiveType.SingleSelect:
          case RenderDirectiveType.SuggestiveSingleSelect:
          case RenderDirectiveType.RadioList: {
            if (exp.value) {
              this.valueCtrl.setValue(exp.value.toString());
            }

            if (!this.optionForControl.isOptional) {
              this.valueCtrl.setValidators(Validators.required);
            } else {
              this.valueCtrl.setValidators(null);
            }
            break;
          }
        }
      }
    } else {
      if (this.optionForControl.isOptional) {
        if (this.optionForControl.dataType !== 'array') {
          switch (this.renderDirective.type) {
            case RenderDirectiveType.File:
            case RenderDirectiveType.SingleSelect:
            case RenderDirectiveType.SuggestiveSingleSelect:
            case RenderDirectiveType.RadioList:
              this.expressionTree.emit({
                data: {
                  type: SubTypeVariable.NullExp
                }
              });
              break;
          }
        } else {
          this.expressionTree.emit({
            data: {
              type: SubTypeVariable.ArrayOfValuesExp,
              arguments: []
            }
          });
        }
      } else {
        this.formArrayValues.setValidators(Validators.required);
      }
    }

    if (exp && this.optionForControl.dataType === 'array') {
      const args = exp.arguments;
      const values: ConfigStaticDataSource[] = [];
      args?.forEach(e => {
        const value = this.dataSources.find(c => c.value === e.value);
        if (value) {
          values.push(value);
          this.formArrayValues.push(
            this.fb.group({
              value: [value, Validators.required],
              sources: []
            })
          );
        }
      });
      this.values = values;
    }

    if (this.formArrayValues.controls.length == 0) {
      this.addItem();
    }
    this.updateDataSourceForAllSingleSelect();

    if (this.optionForControl.disabled) {
      this.valueCtrl.disable({ emitEvent: false });
      this.formArrayValues.disable();
    }
  }

  // for render type: file
  onFileChange(event) {
    if (event.target.files.length > 0) {
      const file: File = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('File too large');
      } else {
        this.uploading = true;
        this.s3Service.generalUpload(file, 'uploads', 'flow').subscribe({
          next: res => {
            if (res.status === Status.COMPLETED) {
              this.uploading = false;
              this.expressionTree.emit({
                data: {
                  type: SubTypeVariable.FileExp,
                  value: res.fileKey,
                  actualFileName: file.name
                }
              });
            }
          },
          error: err => {
            this.toastService.error(err.message);
            this.uploading = false;
          }
        });
      }
    }
  }

  downloadFile(expressionTree: ExpressionTree) {
    if (expressionTree.value) {
      this.fileService.downloadFileV3(<string>expressionTree.value).subscribe({
        next: res => {
          const file = new Blob([res.body], { type: `${res.body.type}` });
          const downloadUrl = URL.createObjectURL(file);
          donwloadFromUrl(downloadUrl, expressionTree.actualFileName, () => {
            URL.revokeObjectURL(downloadUrl);
          });
        },
        error: err => this.toastService.error(err.message)
      });
    }
  }

  // for array
  onChange() {
    if (this.optionForControl.dataType === 'array') {
      switch (this.renderDirective.type) {
        case RenderDirectiveType.SingleSelect: {
          this.updateDataSourceForAllSingleSelect();
          if (this.formArrayValues.valid) {
            const values: ConfigStaticDataSource[] = this.formArrayValues.value.map(i => i.value);
            this.emitValue(values);
          } else {
            this.emitValue([]);
          }
          break;
        }
        case RenderDirectiveType.CheckBox:
          this.emitValue(this.values);
          break;
      }
    }
  }

  addItem() {
    this.formArrayValues.push(
      this.fb.group({
        value: [null, Validators.required],
        sources: []
      })
    );
    this.onChange();
  }

  removeItem(index: number) {
    this.formArrayValues.removeAt(index);
    this.onChange();
  }

  // for render type: single select (array)
  private updateDataSourceForAllSingleSelect() {
    const selectedValues: string[] = this.formArrayValues.value.filter(i => i.value !== null).map(i => i.value.value);
    this.formArrayValues.controls.forEach(form => {
      const curValue: ConfigStaticDataSource = form.get('value').value;
      const sources: ConfigStaticDataSource[] = this.dataSources.filter(
        d => !selectedValues.includes(d.value) || d.value == curValue?.value
      );
      form.get('sources').setValue(sources);
    });
  }

  private emitValue(values: ConfigStaticDataSource[]) {
    const arrValue: ExpressionTree[] = [];
    values?.map(i =>
      arrValue.push({
        type: `value - ${i.valueDataType}`,
        value: Utils.convertValue(i.value, i.valueDataType)
      })
    );

    if (!this.optionForControl.isOptional && arrValue.length == 0) {
      this.expressionTree.emit(null);
    } else {
      this.expressionTree.emit({
        data: {
          type: SubTypeVariable.ArrayOfValuesExp,
          arguments: arrValue
        }
      });
    }
  }
}
