import { Component, OnInit, ViewChild } from '@angular/core';
import { S3Service } from '@b3networks/api/file';
import * as _ from 'lodash';
import { EventStreamService, Status } from '../shared';
import { CalleridRemark, CalleridRemarkService } from './callerid-remark.service';

declare let X: any;

@Component({
  selector: 'app-callerid-remark',
  templateUrl: './callerid-remark.component.html',
  styleUrls: ['./callerid-remark.component.scss']
})
export class CalleridRemarkComponent implements OnInit {
  @ViewChild('file', { static: true }) file;
  uploading = false;
  editing = false;
  deleting = false;
  callerIdRemarks: CalleridRemark[];
  callerIdRemark;
  remarks = [];
  columns = [];

  constructor(
    private s3Service: S3Service,
    private eventStreamService: EventStreamService,
    private calleridRemarkService: CalleridRemarkService
  ) {
    this.eventStreamService.on('callerid:update-remark').subscribe(
      res => {
        const callerIdRemark = { ...res.callerIdRemark, remark: { [res.column]: res.newData } };
        this.calleridRemarkService.update(callerIdRemark).subscribe(
          () => {
            X.showSuccess('This remark was updated');
            this.getRemarks();
            this.eventStreamService.trigger('close-modal', 'confirmation-modal');
          },
          err => {
            X.showWarn('Cannot update this remark.');
          }
        );
      },
      err => {
        X.showWarn('Cannot update this remark.');
      }
    );

    this.eventStreamService.on('callerid:delete-remark').subscribe(
      res => {
        this.calleridRemarkService.delete(res.callerId).subscribe(
          res => {
            X.showSuccess('This remark was deleted');
            this.getRemarks();
            this.eventStreamService.trigger('close-modal', 'confirmation-modal');
          },
          err => {
            X.showWarn('Cannot delete this remark.');
          }
        );
      },
      err => {
        X.showWarn('Cannot delete this remark.');
      }
    );
  }

  ngOnInit() {
    this.getRemarks();
  }

  getRemarks() {
    this.calleridRemarkService.get().subscribe(
      res => {
        this.callerIdRemarks = res;
        this.remarks = this.callerIdRemarks.map(r => {
          const entry = {
            callerId: r.callerId
          };

          for (const key in r.remark) {
            if (r.remark.hasOwnProperty(key)) {
              entry[key] = r.remark[key];
            }
          }

          this.columns = _.union(this.columns, Object.keys(entry));
          return entry;
        });
      },
      err => {
        X.showWarn('Cannot load remarks.');
      }
    );
  }

  toLowercase(str) {
    return _.toLower(str);
  }

  toTitleCase(str) {
    return _.startCase(str);
  }

  edit(index: any, column: any, value: any) {
    this.callerIdRemark = this.callerIdRemarks[index];
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Update remark',
      message: '',
      showTextbox: true,
      label: `${this.toTitleCase(column)}`,
      data: `${value ? value : ''}`,
      type: 'okcancel',
      okEvent: {
        event: 'callerid:update-remark',
        data: {
          callerIdRemark: this.callerIdRemark,
          column: column
        }
      },
      cancelEvent: {}
    });
  }

  delete(index) {
    this.callerIdRemark = this.callerIdRemarks[index];
    this.eventStreamService.trigger('show-confirmation', {
      title: 'Delete remark',
      message: `Are you sure you want to delete remark of <b>${this.callerIdRemark.callerId}?</b>`,
      type: 'yesno',
      okEvent: {
        event: 'callerid:delete-remark',
        data: {
          callerId: this.callerIdRemark.callerId
        }
      },
      cancelEvent: {}
    });
  }

  triggerFileUpload() {
    this.file.nativeElement.click();
  }

  isValidFileType(file: { name: string; type: string }) {
    if (!file) {
      return false;
    }
    return /.*\.csv$/.test(file.name) || file.type === 'text/csv';
  }

  upload(event) {
    this.uploading = true;
    let uploadedFile = null;

    if (event.target.files.length > 0) {
      uploadedFile = event.target.files[0];
    }

    if (!this.isValidFileType(uploadedFile)) {
      this.uploading = false;
      X.showWarn('Invalid file');
      this.file.nativeElement.value = '';
      return;
    }

    this.s3Service.tempUpload(uploadedFile).subscribe(
      res => {
        if (res.status === Status.COMPLETED) {
          this.calleridRemarkService.import(res.tempKey).subscribe(
            res => {
              this.uploading = false;
              this.file.nativeElement.value = '';
              this.getRemarks();
            },
            err => {
              this.uploading = false;
              X.showWarn('Error! Can not upload file.');
              this.file.nativeElement.value = '';
            }
          );
        } else if (res.status === Status.CANCELED) {
          this.uploading = false;
        }
      },
      err => {
        this.uploading = false;
        X.showWarn('Error! Can not upload file.');
        this.file.nativeElement.value = '';
      }
    );
  }
}
