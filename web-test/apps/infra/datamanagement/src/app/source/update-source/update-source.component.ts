import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Source, SourceService } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'b3n-update-source',
  templateUrl: './update-source.component.html',
  styleUrls: ['./update-source.component.scss']
})
export class UpdateSourceComponent extends DestroySubscriberComponent implements OnInit {
  ctaActionName: string = 'Create';
  newSource: Source;
  queryType: string;
  statusCode: '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public source: Source,
    public dialogRef: MatDialogRef<UpdateSourceComponent>,
    private sourceService: SourceService,
    private toastService: ToastService
  ) {
    super();
    if (source) {
      this.newSource = cloneDeep(source);
      this.queryType = this.newSource.esIndex ? 'elasticsearch' : 'mySQL';
      this.ctaActionName = 'Update';
    } else {
      this.newSource = new Source();
      this.newSource.iam = false;
    }
  }

  ngOnInit(): void {}

  updateSource() {
    this.sourceService.updateSource(this.newSource).subscribe(
      _ => {
        this.dialogRef.close(true);
        this.toastService.success(this.ctaActionName + ' successfully');
      },
      err => {
        this.toastService.error(err.message);
      }
    );
  }
}
