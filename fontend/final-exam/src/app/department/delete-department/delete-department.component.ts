
import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DepartmentReq } from '../department-store/department-store.component';

@Component({
  selector: 'delete-department',
  templateUrl: './delete-department.component.html',
  styleUrls: ['./delete-department.component.scss']
})
export class DeleteDepartmentComponent implements OnInit {
  isUpdate: boolean;
  username = new FormControl(null, Validators.required);
  firstName = new FormControl(null, Validators.required);
  lastName = new FormControl(null, Validators.required);
  role = new FormControl(null, Validators.required);
  department = new FormControl(null, Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DepartmentReq,
    private dialogRef: MatDialogRef<DeleteDepartmentComponent>,
  ) {}

  ngOnInit(): void {
    this.isUpdate = this.data.department ? true : false;
  }

}
