import { KeyValue } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FileService, S3Service, Status } from '@b3networks/api/file';
import {
  IpPhoneBrand,
  IPPhoneProvision,
  IpPhoneProvisionService,
  SampleData
} from '@b3networks/api/ipphoneprovisioning';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { saveAs } from 'file-saver';
import { combineLatest } from 'rxjs';
import { debounceTime, finalize, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { CreateTemplateComponent, CreateTemplateData } from './create-template/create-template.component';
import { SampleDataComponent, SampleDataDialog } from './sample-data/sample-data.component';

@Component({
  selector: 'b3n-ipphone-provision',
  templateUrl: './ipphone-provision.component.html',
  styleUrls: ['./ipphone-provision.component.scss']
})
export class IpphoneProvisionComponent extends DestroySubscriberComponent implements OnInit {
  readonly brands: KeyValue<IpPhoneBrand, string>[] = [
    { key: IpPhoneBrand.yealink, value: 'Yealink' },
    { key: IpPhoneBrand.fanvil, value: 'Fanvil' }
  ];

  brandSelectedCtrl = new UntypedFormControl(IpPhoneBrand.yealink);
  dataSource: MatTableDataSource<IPPhoneProvision>;
  displayedColumns = ['brand', 'model', 'version', 'template', 'action'];
  sampleData: SampleData;
  loading: boolean;
  searchTextCtr = new UntypedFormControl('');

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(
    private dialog: MatDialog,
    private toastService: ToastService,
    private ipPhoneProvisionService: IpPhoneProvisionService,
    private fileService: FileService,
    private s3Service: S3Service
  ) {
    super();
  }

  ngOnInit(): void {
    this.ipPhoneProvisionService.getFieldSampleData().subscribe(data => (this.sampleData = data));

    this.brandSelectedCtrl.valueChanges
      .pipe(
        startWith(IpPhoneBrand.yealink),
        switchMap(brand =>
          combineLatest([
            this.ipPhoneProvisionService.getTemplate(brand).pipe(finalize(() => (this.loading = false))),
            this.searchTextCtr.valueChanges.pipe(startWith(this.searchTextCtr.value), debounceTime(300))
          ])
        ),
        map(([data, text]) => (!text ? data : data.filter(x => x.model.toUpperCase().includes(text?.toUpperCase())))),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(data => {
        this.dataSource = new MatTableDataSource<IPPhoneProvision>(data);

        this.dataSource.paginator = this.paginator;
        this.dataSource.paginator.firstPage();
      });
  }

  refresh() {
    this.loading = true;
    this.brandSelectedCtrl.setValue(this.brandSelectedCtrl.value);
  }

  createTemplate() {
    this.dialog
      .open(CreateTemplateComponent, {
        width: '400px',
        disableClose: true,
        data: <CreateTemplateData>{
          isDuplicate: false
        }
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.brandSelectedCtrl.setValue(this.brandSelectedCtrl.value);
        }
      });
  }

  duplicate(item: IPPhoneProvision) {
    this.dialog
      .open(CreateTemplateComponent, {
        width: '400px',
        disableClose: true,
        data: <CreateTemplateData>{
          isDuplicate: true,
          itemCLone: item
        }
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.brandSelectedCtrl.setValue(this.brandSelectedCtrl.value);
        }
      });
  }

  openSampleData(item: IPPhoneProvision) {
    this.dialog.open(SampleDataComponent, {
      width: '600px',
      data: <SampleDataDialog>{
        ipPhoneProvision: item,
        sampleData: this.sampleData
      }
    });
  }

  deleteTemplate(item: IPPhoneProvision) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '700px',
        data: <ConfirmDialogInput>{
          title: 'Delete template',
          message: 'Are you sure you want to delete it manually?',
          confirmLabel: 'Yes, Delete it!',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.ipPhoneProvisionService.deleteTemplate(item.brand, item.model).subscribe(
            res => {
              this.toastService.success('Delete Template Successfully!');
              this.refresh();
            },
            err => {
              this.toastService.error(err.message);
            }
          );
        }
      });
  }

  download(item: IPPhoneProvision) {
    this.fileService.downloadFileV3(item.s3Key).subscribe(resp => {
      console.log('resp: ', resp);
      const file = new Blob([resp.body], { type: `${resp.body.type}` });
      let type = '';
      if (item.s3Key?.includes('.')) {
        const split = item.s3Key.split('.');
        type = split[split.length - 1];
      }
      saveAs(file, `${item.brand}_${item.model}_${new Date().getTime()}${'.' + type}`);
    });
  }

  uploadFile(event, item: IPPhoneProvision) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      this.s3Service.generalUpload(file, 'uploads', 'root-cp').subscribe(
        res => {
          if ([Status.COMPLETED, Status.CANCELED].includes(res.status)) {
          }
          if (res.status === Status.COMPLETED) {
            const s3Key = res?.keyForSignApi;
            const clone: IPPhoneProvision = Object.assign({}, item);
            clone.s3Key = s3Key;
            this.ipPhoneProvisionService.updateTemplate(clone).subscribe(data => {
              item.s3Key = s3Key;
              this.toastService.success('Upload successfully!');
            });
          }
        },
        err => {
          this.toastService.error(err.message);
        }
      );
    }
  }
}
