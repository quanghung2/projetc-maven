import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Source, SourceService } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { format } from 'date-fns-tz';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'b3n-test-descriptor',
  templateUrl: './test-descriptor.component.html',
  styleUrls: ['./test-descriptor.component.scss']
})
export class TestDescriptorComponent extends DestroySubscriberComponent implements OnInit {
  ctaActionName = 'Execute';
  newSource: Source;
  queryType: string;
  fields: string[] = [];
  statusCode = '';
  text = '';
  timeZone = '+00:00';
  responseData: any = [];

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

  constructor(
    @Inject(MAT_DIALOG_DATA) public source: Source,
    public dialogRef: MatDialogRef<TestDescriptorComponent>,
    private sourceService: SourceService,
    private toastService: ToastService
  ) {
    super();
    if (source) {
      this.newSource = cloneDeep(source);
      this.queryType = this.newSource.esIndex ? 'elasticsearch' : 'mySQL';
      this.findfields(this.newSource.statement);
      this.initBodyJson();
    }
  }

  ngOnInit(): void {}

  TestDescriptor() {
    if (this.isJson(this.text)) {
      const requestBody = JSON.parse(this.text);

      this.sourceService.testDescriptor(this.newSource.descriptor, requestBody).subscribe(
        res => {
          this.statusCode = res['status'].toString();
          this.responseData = JSON.stringify(res.body, null, '\t');
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

  findfields(statment) {
    this.fields = [];
    const output = Object.assign([], statment);
    let field = '';
    const charStart = this.queryType === 'mySQL' ? ':' : '$';

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
        ((this.queryType === 'mySQL' && (!reg.test(element) || element === ' ')) ||
          (this.queryType !== 'mySQL' && element === '}'))
      ) {
        startfield = false;
        field = field.substring(this.queryType === 'mySQL' ? 0 : 1, field.length - 1);
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

  setValueDefault(field) {
    if (this.valueDefault[field]) {
      return `"${this.valueDefault[field]}"`;
    } else if (this.valueDefault[field] === null) {
      return `${this.valueDefault[field]}`;
    } else {
      return `""`;
    }
  }

  isJson(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return false;
    }
  }
}
