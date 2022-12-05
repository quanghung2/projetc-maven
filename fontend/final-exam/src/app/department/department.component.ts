import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
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

  listDepartment: Department[] = [{
    name: 'Sale', totalMember: '123', type: 'PM', createDate: '05/10/2021'
  },
  {
    name: 'Academy', totalMember: '12', type: 'DEV', createDate: '05/12/2000'
  },
  {
    name: 'HR', totalMember: '1', type: 'Scrum Master', createDate: '05/12/2000'
  },
  {
    name: 'Education', totalMember: '2', type: 'DEV', createDate: '05/11/2021'
  },
  {
    name: 'Tester', totalMember: '5', type: 'Test', createDate: '04/10/2021'
  },
  {
    name: 'Education', totalMember: '8', type: 'DEV', createDate: '02/10/2021'
  },
  {
    name: 'Tester', totalMember: '3', type: 'Test', createDate: '01/10/2021'
  }
]
  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    this.dataSource = new MatTableDataSource<Department>(this.listDepartment);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  refresh() {

  }

  updateOrCreate(department?: Department) {
    this.dialog
      .open(DepartmentStoreComponent, {
        width: '500px',
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
