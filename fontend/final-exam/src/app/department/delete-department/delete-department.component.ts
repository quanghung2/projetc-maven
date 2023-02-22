
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DepartmentService } from 'src/app/common/service/department.service';
import { ToastService } from 'src/app/common/toast/service/toast.service';
import { DepartmentReq } from '../department-store/department-store.component';

@Component({
  selector: 'delete-department',
  templateUrl: './delete-department.component.html',
  styleUrls: ['./delete-department.component.scss']
})
export class DeleteDepartmentComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DepartmentReq,
    private dialogRef: MatDialogRef<DeleteDepartmentComponent>,
    private departmentService: DepartmentService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    console.log(this.data.department.id)
  }

  deleteDepartment() {
    this.departmentService.delete(this.data.department.id).subscribe(
      _=> {
      this.toastService.success('Delete successfully');
      this.dialogRef.close(true)
    },
      err => this.toastService.error('Delete failed')
    );
  }
}
