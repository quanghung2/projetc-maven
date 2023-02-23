import { KeyValue } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { FileService, S3Service, Status } from '@b3networks/api/file';
import { GatherBranch, GatherBranchType, UploadEvent } from '@b3networks/api/ivr';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { SampleFileService } from '../../../../core/service/sample-file.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'b3n-gather-branch',
  templateUrl: './gather-branch.component.html',
  styleUrls: ['./gather-branch.component.scss'],
  encapsulation: ViewEncapsulation.None,
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class GatherBranchComponent implements OnInit, OnChanges {
  gatherBranchOptions: KeyValue<GatherBranchType, string>[] = [
    { key: GatherBranchType.one, value: 'Equals To' },
    { key: GatherBranchType.any, value: 'Any Digit' },
    { key: GatherBranchType.none, value: 'No Digit' },
    { key: GatherBranchType.multiple, value: 'Upload Digits' },
    { key: GatherBranchType.regex, value: 'Matches Regex' }
  ];

  GatherBranchType = GatherBranchType;

  @Input() blockUuid: string;
  @Input() branch: GatherBranch;
  @Output() triggerReloadBranchLabelEvent = new EventEmitter();

  downloading: boolean;

  fileName: string;

  constructor(
    private s3Service: S3Service,
    private fileService: FileService,
    private sampleFile: SampleFileService,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {}

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
            this.branch.s3Key = res.keyForSignApi;
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

  branchTypeChange(event: MatSelectChange) {
    if (
      this.branch.type === GatherBranchType.one &&
      [GatherBranchType.any.valueOf(), GatherBranchType.none.valueOf()].includes(this.branch.digit)
    ) {
      this.branch.digit = undefined;
      this.branch.label = 'Digit equals to ';
    }

    if (this.branch.type === GatherBranchType.any) {
      this.branch.digit = GatherBranchType.any;
    }

    if (this.branch.type === GatherBranchType.none) {
      this.branch.digit = GatherBranchType.none;
    }

    if ([GatherBranchType.regex, GatherBranchType.multiple].includes(this.branch.type)) {
      this.branch.digit = '';
    }
    this.constructBranchLabel();
  }

  constructBranchLabel() {
    this.triggerReloadBranchLabelEvent.emit();
  }

  downloadSample() {
    this.sampleFile.downloadSampleCSVFile();
  }
}
