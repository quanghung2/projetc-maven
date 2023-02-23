import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CampaignService } from '@b3networks/api/callcenter';
import { BulkFilterService, JobBulkFilterReq } from '@b3networks/api/dnc';
import { S3Service } from '@b3networks/api/file';
import { SampleFileService } from '@b3networks/comms/callcenter/shared';
import { downloadData, randomGuid } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { of, Subject, timer } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { InfoUploadComponent, InfoUploadInput } from '../info-upload/info-upload.component';

@Component({
  selector: 'b3n-upload-numbers',
  templateUrl: './upload-numbers.component.html',
  styleUrls: ['./upload-numbers.component.scss']
})
export class UploadNumbersComponent implements OnInit, OnDestroy {
  @Output() uploadDoneEvent = new EventEmitter<{
    file: File;
    fileKey: string;
  }>();
  @Output() uploadEvent = new EventEmitter<boolean>();
  @Output() onBackgroundUploading = new EventEmitter();

  @Input() viewWidget: boolean;
  @Input() backgroundUploading: boolean;

  file: any;
  fileCSV: Blob;

  private _destroyPolling = new Subject();

  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent | any) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent | any) {
    event.preventDefault();
    event.stopPropagation();
    const files = (Array.from(event.dataTransfer.files) as File[]).filter(x => x.type === 'text/csv');
    if (files.length > 0) {
      this.upload(files[0]);
    }
  }

  constructor(
    private s3Service: S3Service,
    private campaignService: CampaignService,
    private sampleFileService: SampleFileService,
    private toastService: ToastService,
    private bulkFilterService: BulkFilterService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {}

  ngOnDestroy(): void {
    this._destroyPolling.next(true);
    this._destroyPolling.unsubscribe();
  }

  download() {
    downloadData(this.fileCSV, `Bulk_Filtering_Result_${new Date().getTime()}`);
  }

  downloadSampleFileService() {
    this.sampleFileService.downloadTemplateCSVFile();
  }

  onBackgroundFileChange(event) {
    this.uploadEvent.emit(true);
    let uploadedFile = null;
    if (event.target.files.length > 0) {
      uploadedFile = event.target.files[0];
      this.upload(uploadedFile);
    }
  }

  private upload(uploadedFile: File) {
    if (this.backgroundUploading) {
      return;
    }

    this.updateBackgroundUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsText(uploadedFile);
      reader.onload = e => {
        const csv = reader.result;
        const numbers = (csv as string)?.split('\n');

        if (numbers?.length > 50000) {
          this.toastService.error('Only supports a maximum of 50000 numbers!');
          this.updateBackgroundUploading(false);
          this.file = null;
          return;
        }

        console.log('data: ', numbers);

        this.dialog
          .open(InfoUploadComponent, {
            width: '500px',
            disableClose: true,
            data: <InfoUploadInput>{
              numbers: numbers
            }
          })
          .afterClosed()
          .subscribe(data => {
            console.log('email: ', data?.email);
            if (data) {
              this.createJob(data?.email, data?.numbers);
            } else {
              this.updateBackgroundUploading(false);
              this.file = null;
            }
          });
      };
      reader.onerror = () => {
        this.toastService.error('Unable to read ' + uploadedFile.name);
        this.updateBackgroundUploading(false);
        this.file = null;
      };
    } catch (error) {
      this.toastService.error(error as any);
      this.updateBackgroundUploading(false);
      this.file = null;
    }
  }

  private createJob(email: string, numbers: string[]) {
    const bulkUuid = randomGuid();
    const req = <JobBulkFilterReq>{
      email: email,
      numbers: numbers
    };
    this.bulkFilterService.createJob(bulkUuid, req).subscribe(
      res => {
        this.fileCSV = null;
        this.pollingJob(bulkUuid);
      },
      err => {
        this.toastService.error(err?.message);
        this.updateBackgroundUploading(false);
        this.file = null;
      }
    );
  }

  private updateBackgroundUploading(isUploading: boolean) {
    this.onBackgroundUploading.emit(isUploading);
  }

  private pollingJob(bulkUuid: string) {
    this._destroyPolling.next(true);
    timer(1000, 5000)
      .pipe(
        switchMap(() =>
          this.bulkFilterService.getAllJobCreated().pipe(
            catchError(() => {
              this._destroyPolling.next(true);
              return of([]);
            })
          )
        ),
        map(jobs => jobs?.find(x => x.bulkUuid === bulkUuid)),
        switchMap(job => {
          console.log('job: ', job);
          if (!job || !job?.completed) {
            return of(null);
          }

          return this.bulkFilterService.getResultBulkFilter(job?.bulkUuid);
        }),
        catchError(() => {
          this._destroyPolling.next(true);
          return of(null);
        }),
        takeUntil(this._destroyPolling)
      )
      .subscribe(resp => {
        if (resp) {
          this._destroyPolling.next(true);
          const file = new Blob([resp.body], { type: `${resp.body.type}` });
          this.fileCSV = file;
          downloadData(file, `Bulk_Filtering_Result_${new Date().getTime()}`);
          this.updateBackgroundUploading(false);
          this.toastService.success('Done successfully!');
        }
      });
  }
}
