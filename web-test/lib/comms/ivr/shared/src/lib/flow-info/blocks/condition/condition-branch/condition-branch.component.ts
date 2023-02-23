import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { MatSelectChange } from '@angular/material/select';
import { FileService, GeneralUploadRes, S3Service, Status } from '@b3networks/api/file';
import { ConditionBranch, ConditionBranchType, UploadEvent } from '@b3networks/api/ivr';
import { ToastService } from '@b3networks/shared/ui/toast';
import { MatDatepickerInputEvent } from '@matheo/datepicker';
import { MatDateFormats } from '@matheo/datepicker/core';
import { finalize } from 'rxjs/operators';
import { SampleFileService } from '../../../../core/service/sample-file.service';
import { ValidCheckService } from '../../../../core/service/valid-check.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const MY_FORMATS: MatDateFormats = {
  parse: {
    dateInput: null,
    datetimeInput: null,
    timeInput: null,
    monthInput: null,
    yearInput: null
  },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    datetimeInput: {
      // year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: 'numeric'
    },

    timeInput: { hour: 'numeric', minute: 'numeric' },
    monthInput: { month: 'short', year: 'numeric' },
    yearInput: { year: 'numeric' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthLabel: { month: 'short' },
    monthDayLabel: { month: 'short', day: 'numeric' },
    monthDayA11yLabel: { month: 'long', day: 'numeric' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
    timeLabel: { hours: 'numeric', minutes: 'numeric' }
  }
};

@Component({
  selector: 'b3n-condition-branch',
  templateUrl: './condition-branch.component.html',
  styleUrls: ['./condition-branch.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }],
  providers: [{ provide: MAT_DATE_FORMATS, useValue: MY_FORMATS }]
})
export class ConditionBranchComponent implements OnInit, OnChanges {
  conditionBranchOptions: KeyValue<ConditionBranchType, string>[] = [
    { key: ConditionBranchType.callerIdPattern, value: 'Match Pattern' },
    { key: ConditionBranchType.dateInRange, value: 'In Date Range' },
    { key: ConditionBranchType.timeInRange, value: 'In Time Range' },
    { key: ConditionBranchType.dayOfWeek, value: 'Day of the Week' },
    { key: ConditionBranchType.callerIdInList, value: 'Upload Numbers' },
    {
      key: ConditionBranchType.validateExpression,
      value: 'Validate Expression '
    },
    { key: ConditionBranchType.otherwise, value: 'Otherwise' }
  ];

  readonly dayOfWeek: KeyValue<string, string>[] = [
    { key: 'MONDAY', value: 'Monday' },
    { key: 'TUESDAY', value: 'Tuesday' },
    { key: 'WEDNESDAY', value: 'Wednesday' },
    { key: 'THURSDAY', value: 'Thursday' },
    { key: 'FRIDAY', value: 'Friday' },
    { key: 'SATURDAY', value: 'Saturday' },
    { key: 'SUNDAY', value: 'Sunday' }
  ];

  ConditionBranchType = ConditionBranchType;
  fileName: string;

  private _branch: ConditionBranch;

  @Input() blockUuid: string;

  @Input()
  set branch(branch: ConditionBranch) {
    if (!(branch instanceof ConditionBranch)) {
      this._branch = new ConditionBranch(branch);
    } else {
      this._branch = branch;
    }

    this.fromInDate = this.branch.fromInDate;
    this.toInDate = this.branch.toInDate;
  }

  get branch(): ConditionBranch {
    return this._branch;
  }

  @Output() triggerReloadBranchLabelEvent = new EventEmitter();

  startWiths: string;

  downloading: boolean;

  fromInDate: Date = new Date();
  toInDate: Date = new Date();

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private s3Service: S3Service,
    private fileService: FileService,
    private validCheckService: ValidCheckService,
    private sampleFile: SampleFileService,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    this.startWiths = undefined;

    if (this.branch.startWithList && this.branch.startWithList.length > 0) {
      this.startWiths = this.branch.startWithList.join(',');
    }
  }

  selectCSVFile(event) {
    this.branch.uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      if (file.size > MAX_FILE_SIZE) {
        this.toastService.warning(`Exceeded the maximum file size (5MB)`, 4000);
        return;
      }

      this.branch.uploadIndicator = true;
      this.s3Service.generalUpload(file, 'uploads', 'ivr/csv').subscribe(
        res => {
          this.branch.uploadEvent = res;

          if (this.branch.uploadEvent.status === Status.COMPLETED) {
            this.branch.uploadIndicator = false;
            this.branch.s3Key = (<GeneralUploadRes>res).keyForSignApi;
            this.fileName = file.name;
            this.toastService.success('Uploaded successfully.');
          }
        },
        err => {
          this.toastService.error(err.message);
        }
      );
    } else {
      this.branch.uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
      this.branch.uploadIndicator = false;
    }
  }

  onSelectionChange(change: MatSelectChange) {
    if ([ConditionBranchType.dateInRange, ConditionBranchType.timeInRange].includes(this.branch.type)) {
      this.branch.from = undefined;
      this.branch.to = undefined;
    }
    this.constructBranchLabel();
  }

  downloadFile() {
    this.downloading = true;
    this.fileService
      .getDownloadFileUrl(this.branch.s3Key)
      .pipe(finalize(() => (this.downloading = false)))
      .subscribe(url => {
        this.download('file', url.url);
      });
  }

  private download(filename, url) {
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('target', '_blank');
    // element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }

  onChangeStartWiths() {
    if (this.startWiths) {
      this.branch.startWithList = this.startWiths.split(',');
    } else {
      this.branch.startWithList = [];
    }
    console.log(this.branch);

    this.constructBranchLabel();
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.branch.startWithList.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(fruit: string): void {
    const index = this.branch.startWithList.indexOf(fruit);
    if (index >= 0) {
      this.branch.startWithList.splice(index, 1);
    }
    this.validCheckService.checkInvalidConditionBlock(this.branch.startWithList);
  }

  changeFrom(event: MatDatepickerInputEvent<any>) {
    this.branch.fromInDate = event.value;
    this.constructBranchLabel();
  }

  changeTo(event: any) {
    this.branch.toInDate = event.value;
    this.constructBranchLabel();
  }

  constructBranchLabel() {
    this.triggerReloadBranchLabelEvent.emit();
  }

  downloadSample() {
    this.sampleFile.downloadSampleCSVFile();
  }

  onSelectDaysOfWeekChanged(event: MatSelectChange) {
    this.branch.days = event.value;
  }

  selectAll() {
    this.branch.days = this.dayOfWeek.map(day => day.key);
  }

  deselectAll() {
    this.branch.days = [];
  }
}
