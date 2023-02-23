import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { JobDetailModel } from '@b3networks/api/file';

@Component({
  selector: 'b3n-view-job-detail',
  templateUrl: './view-job-detail.component.html',
  styleUrls: ['./view-job-detail.component.scss']
})
export class ViewJobDetailComponent implements OnInit {
  jobDetail: JobDetailModel;

  constructor(@Inject(MAT_DIALOG_DATA) data: JobDetailModel) {
    this.jobDetail = data;
  }

  ngOnInit(): void {}
}
