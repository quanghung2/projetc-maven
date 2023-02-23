import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { FileService, S3Service, Status } from '@b3networks/api/file';
import {
  ConfigStaticDataSource,
  DataSourceQuery,
  ExpressionTree,
  RegexValidation,
  RenderDirective,
  RenderDirectiveType,
  SubTypeVariable,
  VisibilityDep
} from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent, donwloadFromUrl } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';

export interface OptionForInput {
  arrayItemDataType: string;
  dataType: string;
  defaultValueTree: ExpressionTree;
  expressionTree: ExpressionTree;
  hidden: boolean;
  isOptional: boolean;
  key: string;
  title: string;
  renderDirective: RenderDirective;
  visibilityDep: VisibilityDep;
  customRegexValidation: RegexValidation;
  visible: boolean;
  readonly: boolean;
}

@Component({
  selector: 'b3n-input-param',
  templateUrl: './input-param.component.html',
  styleUrls: ['./input-param.component.scss']
})
export class InputParamComponent extends DestroySubscriberComponent implements OnInit {
  @Input() optionForInput: OptionForInput;
  @Input() exceptValueOfDts: string;
  @Output() valueChanges = new EventEmitter<ExpressionTree>();
  readonly renderDirectiveType = RenderDirectiveType;
  uploading: boolean; // for file
  dataSources: ConfigStaticDataSource[];
  valueCtrl = new UntypedFormControl(null);
  requireField = false;

  getErrorInput() {
    return Utils.getErrorInput(this.valueCtrl);
  }

  displayFn(dts: ConfigStaticDataSource): string {
    return dts && dts.label ? dts.label : '';
  }

  constructor(
    private s3Service: S3Service,
    private fileService: FileService,
    private toastService: ToastService,
    private dataSourceQuery: DataSourceQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.requireField = !this.optionForInput.isOptional && this.optionForInput.visible;
    this.valueCtrl.setValidators(
      Utils.validateInput({
        required: this.requireField,
        dataType: this.optionForInput.dataType,
        maxlength: ValidateStringMaxLength.USER_INPUT,
        max: ValidateNumberValue.MAX,
        min: ValidateNumberValue.MIN,
        pattern: this.optionForInput.customRegexValidation
      })
    );

    this.valueCtrl.valueChanges.subscribe(val => {
      if (this.optionForInput.dataType === 'boolean') {
        if (val !== null) {
          this.valueChanges.emit({
            type: `value - boolean`,
            value: val
          });
        } else {
          if (!this.requireField) {
            this.valueChanges.emit({ type: SubTypeVariable.NullExp });
          } else {
            this.valueChanges.emit(null);
          }
        }
      } else {
        if (val) {
          if (typeof val !== 'object') {
            this.valueChanges.emit({
              type: `value - ${this.optionForInput.dataType}`,
              value: this.optionForInput.dataType === 'number' ? Utils.convertValue(val, 'number') : val
            });
          } else {
            this.valueChanges.emit({
              type: `value - ${this.optionForInput.dataType}`,
              value: this.optionForInput.dataType === 'number' ? Utils.convertValue(val.value, 'number') : val.value
            });
          }
        } else {
          if (!this.requireField) {
            this.valueChanges.emit({ type: SubTypeVariable.NullExp });
          } else {
            this.valueChanges.emit(null);
          }
        }
      }
    });

    if (!this.requireField) {
      this.valueCtrl.setValidators(null);
    }

    if (this.optionForInput.expressionTree) {
      if (this.optionForInput.dataType === 'boolean') {
        this.valueCtrl.setValue(this.optionForInput.expressionTree?.value);
      } else {
        this.valueCtrl.setValue(this.optionForInput.expressionTree?.value?.toString());
      }
    }

    if (this.optionForInput.readonly) {
      this.valueCtrl.disable();
    }

    if (this.optionForInput.renderDirective) {
      this.dataSourceQuery
        .selectDataSource(this.optionForInput.renderDirective.valueListUuid)
        .pipe(takeUntil(this.destroySubscriber$))
        .subscribe(res => {
          this.dataSources = res;

          // hardcode for offer callback
          if (this.exceptValueOfDts) {
            this.dataSources = this.dataSources?.filter(dts => dts.value !== this.exceptValueOfDts);
          }

          if (this.optionForInput.expressionTree) {
            switch (this.optionForInput.renderDirective.type) {
              case RenderDirectiveType.File:
                this.valueChanges.emit(this.optionForInput.expressionTree);
                break;
              case RenderDirectiveType.SuggestiveSingleSelect: {
                const label = this.dataSources?.find(dts => dts.value === this.optionForInput.expressionTree.value);
                this.valueCtrl.setValue(label, { emitEvent: false });
                break;
              }
            }
          }
        });
    }
  }

  // for render type: file
  onFileChange(event) {
    if (event.target.files.length > 0) {
      const file: File = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('Exceeded the maximum file size (5MB)');
      } else {
        this.uploading = true;
        this.s3Service
          .generalUpload(file, 'uploads', 'bauser')
          .pipe(finalize(() => (this.uploading = false)))
          .subscribe({
            next: res => {
              if (res.status === Status.COMPLETED) {
                this.valueChanges.emit({
                  type: SubTypeVariable.FileExp,
                  value: res.fileKey,
                  actualFileName: file.name
                });
              }
            },
            error: err => this.toastService.error(err)
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
}
