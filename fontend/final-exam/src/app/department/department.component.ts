import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { DepartmentService } from '../common/service/department.service';
import { DeleteDepartmentComponent } from './delete-department/delete-department.component';
import { DepartmentReq, DepartmentStoreComponent } from './department-store/department-store.component';

export interface Department {
  name: string;
  totalMember: string;
  type: string;
  createDate: string;
}
@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss']
})
export class DepartmentComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<Department>();
  readonly displayedColumns = ['name', 'totalMember', 'type', 'createDate', 'actions'];

  constructor(private dialog: MatDialog, private departmentService: DepartmentService) { }

  ngOnInit(): void {
    this.departmentService.getAll().subscribe(res => {
      console.log(res)
      this.dataSource = new MatTableDataSource<Department>(res.content);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
    })
    
  }

  refresh() {

  }

  updateOrCreate(department?: Department) {
    this.dialog
      .open(DepartmentStoreComponent, {
        width: '450px',
        disableClose: true,
        autoFocus: false,
        data: <DepartmentReq>{
          department: department
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.refresh();
        }
      });
  }


  deleteDepartment(account: Department) {
    this.dialog
      .open(DeleteDepartmentComponent, {
        width: '450px',
        disableClose: true,
        autoFocus: false,
        data: <DepartmentReq>{
          department: account
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.refresh();
        }
      });
  }
}
