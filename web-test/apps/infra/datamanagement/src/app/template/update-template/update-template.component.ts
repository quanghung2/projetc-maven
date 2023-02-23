import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Period, Source, SourceQuery, SourceService, Template, TemplateService } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { format } from 'date-fns-tz';
import { cloneDeep } from 'lodash';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-template',
  templateUrl: './update-template.component.html',
  styleUrls: ['./update-template.component.scss']
})
export class UpdateTemplateComponent extends DestroySubscriberComponent implements OnInit {
  ctaActionName = 'Create';
  newTemplate: Template;
  sources: Source[];
  filteredSources: Source[];
  queryType: string;
  fields: string[] = [];
  statusCode = '';
  config = '';
  timeZone = '+00:00';
  isLoading = true;
  period = '';
  fieldRoot = '';
  loadingExtractData = false;
  sampleData: any = [];

  periodOptions: KeyValue<Period, string>[] = [
    { key: Period['*'], value: '*' },
    { key: Period['15m'], value: '15 minutes' },
    { key: Period['30m'], value: '30 minutes' },
    { key: Period['1h'], value: '1 hour' },
    { key: Period['1d'], value: '1 day' },
    { key: Period['1M'], value: '1 month' }
  ];

  formatOptions = [
    { key: 'decimal', value: '#,##0.00', display: 'Decimal ' },
    { key: 'duration', value: 'HH:mm:ss', display: 'Duration ' },
    { key: 'percent', value: '0.00', display: 'Percentage ' },
    { key: 'datetime', value: 'yyyy-MM-dd HH:mm:ss', display: 'Date Time' },
    { key: 'none', value: '', display: 'None' }
  ];

  configFields = {};
  configType = 'design';

  fileNameDesignMode = '';

  text = '';
  designFields = [];

  excludedFields = ['id', '_id', 'key', '_key', 'accessors'];

  valueDefault = {
    startTime: format(subDays(startOfDay(new Date()), 7), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: this.timeZone
    }),
    endTime: format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: this.timeZone
    }),
    orgUuid: '9d336117-63e5-412e-96ca-fa5f5627b4ac',
    accessor: '9d336117-63e5-412e-96ca-fa5f5627b4ac',
    period: '1d',
    queryString: null
  };

  designConfig: UntypedFormGroup;

  get templateFields() {
    return this.designConfig.controls['templateFields'] as UntypedFormArray;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public template: Template,
    public dialogRef: MatDialogRef<UpdateTemplateComponent>,
    private sourceService: SourceService,
    private sourceQuery: SourceQuery,
    private toastService: ToastService,
    private templateService: TemplateService,
    private fb: UntypedFormBuilder
  ) {
    super();
    if (template) {
      this.newTemplate = cloneDeep(template);
      this.period = Object.keys(this.newTemplate.config)[0];
      this.configFields = this.newTemplate.config[this.period];
      this.fileNameDesignMode = this.configFields['filename']
        ? this.configFields['filename'].substring(0, this.configFields['filename'].length - 11)
        : '';
      this.ctaActionName = 'Update';
    } else {
      this.newTemplate = new Template();
      this.configFields = {
        filename: ' {range}.csv',
        filter: {},
        queryString: null,
        sortDefs: [
          {
            name: '',
            sortDesc: false
          }
        ],
        iterate: null,
        columnDefs: [
          {
            name: '',
            expression: '',
            format: ''
          },
          {
            name: '',
            expression: '',
            format: ''
          },
          {
            name: '',
            expression: '',
            format: ''
          }
        ]
      };
    }
    this.initConfig();
  }

  ngOnInit() {
    this.sourceService.getSources().subscribe();
    this.sourceQuery.source$.pipe(finalize(() => (this.isLoading = false))).subscribe(source => {
      this.sources = source;
      this.filterDescriptor();
      this.getstatmentParams();
    });
  }

  updateTemplate() {
    if (this.isJson(this.config)) {
      this.newTemplate.config = JSON.parse(this.config);
      if (this.configType !== 'raw' && this.designConfig) {
        this.newTemplate.config['columnDefs'] = this.applyDesignConfig();
        this.newTemplate.config['filename'] = `${this.fileNameDesignMode}  {range}.csv`;
      }
      if (this.newTemplate.type === 'dump') {
        this.period = this.newTemplate.type;
      }
      this.templateService.updateTemplate(this.newTemplate, this.period).subscribe(
        res => {
          this.dialogRef.close(true);
          this.toastService.success(this.ctaActionName + ' successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
    } else {
      this.toastService.error('Invalid Json');
    }
  }

  initConfig() {
    this.config = JSON.stringify(this.configFields, null, '\t');
  }

  getstatmentParams() {
    if (this.newTemplate.descriptor && this.configType === 'design') {
      const descriptor = this.sources.find(s => s.descriptor === this.newTemplate.descriptor);
      this.findfields(descriptor);
      this.initBodyJson();
    } else {
      this.text = '';
    }
  }

  findfields(descriptor: Source) {
    this.fields = [];
    const output = Object.assign([], descriptor.statement);
    let field = '';
    const charStart = descriptor.esIndex ? '$' : ':';

    let startfield = false;

    const reg = new RegExp(/^[a-zA-Z0-9_]*$/);

    output.forEach(element => {
      if (element == charStart) {
        startfield = true;
        return;
      }
      if (startfield) {
        field = field + element;
      }
      if (
        startfield &&
        ((!descriptor.esIndex && (!reg.test(element) || element === ' ')) || (descriptor.esIndex && element === '}'))
      ) {
        startfield = false;
        field = field.substring(!descriptor.esIndex ? 0 : 1, field.length - 1);
        if (this.fields.indexOf(field) === -1) {
          this.fields.push(field);
        }
        field = '';
      }
    });
  }

  initBodyJson() {
    this.text = '{\n';
    this.fields.forEach(field => {
      this.text = this.text + `\t"${field}": ${this.setValueDefault(field)}`;
      if (this.fields[this.fields.length - 1] !== field) {
        this.text = this.text + ',\n';
      } else {
        this.text = this.text + '\n}';
      }
    });
  }

  setValueDefault(field: string) {
    if (this.valueDefault[field]) {
      return `"${this.valueDefault[field]}"`;
    } else if (this.valueDefault[field] === null) {
      return `${this.valueDefault[field]}`;
    } else {
      return `""`;
    }
  }

  getSampleDataDescriptor() {
    if (this.isJson(this.text)) {
      this.loadingExtractData = true;
      this.designFields = [];
      const requestBody = JSON.parse(this.text);
      this.sourceService
        .testDescriptor(this.newTemplate.descriptor, requestBody)
        .pipe(finalize(() => (this.loadingExtractData = false)))
        .subscribe(
          res => {
            if (res.body && res.body[0]) {
              const sampleBody = res.body[0];
              this.initDesignFields(sampleBody);
              this.initDesignConfig();
              this.sampleData = JSON.stringify(res.body, null, '\t');
              this.toastService.success('Extract data fields successful');
            } else {
              this.sampleData = '';
              this.toastService.warning('Cannot extract data fields as no data available');
            }
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    } else {
      this.toastService.error('Invalid Json');
    }
  }

  initDesignFields(sampleBody) {
    if (sampleBody && typeof sampleBody == 'object') {
      Object.keys(sampleBody).forEach(f => {
        if (typeof sampleBody[f] == 'object') {
          this.fieldRoot = (!this.fieldRoot.includes('$') ? '$.' : '') + this.fieldRoot + f + '.';
          this.initDesignFields(Array.isArray(sampleBody[f]) ? sampleBody[f][0] : sampleBody[f]);
        } else {
          if (!this.excludedFields.includes(f)) {
            if (this.fieldRoot) {
              this.designFields.push(this.fieldRoot + f);
            } else {
              this.designFields.push(this.fieldRoot + '$.' + f);
            }
          }
        }
      });
    }
    if (this.fieldRoot && this.fieldRoot.split('.').length > 1) {
      const a = this.fieldRoot.split('.');
      a.splice(a.length - 2, 2);
      this.fieldRoot = a.join('.');
      this.fieldRoot = this.fieldRoot + '.';
    }
  }

  initDesignConfig() {
    this.designConfig = this.fb.group({
      templateFields: this.fb.array([])
    });
    const columnDefs = this.configFields['columnDefs'];
    columnDefs.forEach(col => {
      this.addField(col);
    });
  }

  addField(col) {
    let option = this.formatOptions.find(f => f.key === (col.format.length > 0 ? col.format.split(':')[0] : ''));
    if (!option) {
      option = { key: 'none', value: '', display: 'None' };
    }
    const a = this.fb.group({
      name: [col.name],
      formatOption: [option.key],
      format: this.initFormatFromOption(option.key),
      expression: this.initExpression(col.expression),
      fieldCustom: this.initFieldCustom(col.expression)
    });
    this.designConfig.controls['templateFields']['controls'].push(a);
  }
  removeField(i) {
    this.designConfig.controls['templateFields']['controls'].splice(i, 1);
  }

  initFieldCustom(expression: string) {
    if (this.designFields.find(f => f === expression)) {
      return [''];
    } else {
      return [expression];
    }
  }

  initExpression(expression: string) {
    if (this.designFields.find(f => f === expression) || expression === '') {
      return [expression];
    } else {
      return ['custom'];
    }
  }

  initFormatFromOption(key: string) {
    const format = this.formatOptions.find(f => f.key === key);
    return [{ value: format.value, disabled: format.key === 'none' }];
  }

  checkDisableFormat(field: UntypedFormGroup) {
    const format = this.formatOptions.find(f => f.key === field.controls['formatOption'].value);
    field.controls['format'].setValue(format ? format.value : '');
    if (format.key === 'none') {
      field.controls['format'].disable();
    } else {
      field.controls['format'].enable();
    }
  }

  newColumn() {
    return {
      name: '',
      expression: '',
      format: ''
    };
  }

  applyDesignConfig() {
    const columnDefs = [];
    for (const field of this.designConfig.controls['templateFields']['controls']) {
      columnDefs.push({
        name: field.value.name,
        format:
          field.value.formatOption === 'none'
            ? field.value.formatOption
            : `${field.value.formatOption}:${field.value.format}`,
        expression: field.value.expression === 'custom' ? field.value.fieldCustom : field.value.expression
      });
    }
    return columnDefs;
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.designConfig.controls['templateFields']['controls'], event.previousIndex, event.currentIndex);
  }

  isJson(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return false;
    }
  }

  setValueCustom() {
    return `<Custom Expression>`;
  }

  filterDescriptor() {
    const filterValue = this.newTemplate ? this.newTemplate?.descriptor?.toLowerCase() : '';
    if (filterValue) {
      this.filteredSources = this.sources.filter(f => f.descriptor.toLowerCase().includes(filterValue));
    } else {
      this.filteredSources = this.sources;
    }
  }
}
