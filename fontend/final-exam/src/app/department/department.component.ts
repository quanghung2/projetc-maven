import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Department } from '../common/model/department';
import { DepartmentService } from '../common/service/department.service';
import { DeleteDepartmentComponent } from './delete-department/delete-department.component';
import { DepartmentReq, DepartmentStoreComponent } from './department-store/department-store.component';
import { startWith, takeUntil, finalize } from 'rxjs/operators';
import { DestroySubscriberComponent } from '../common/destroy-subscriber.component';

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss']
})
export class DepartmentComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  searchCtrl = new FormControl();
  dataSource: MatTableDataSource<Department> = new MatTableDataSource<Department>();
  data: Department[] = [];
  loading: boolean;
  readonly displayedColumns = ['name', 'totalMember', 'type', 'actions'];

  constructor(
    private dialog: MatDialog, 
    private departmentService: DepartmentService) 
    { 
      super();
    }

  ngOnInit(): void {
    this.loading = true;
    this.departmentService.getAll()
    .pipe(finalize(() => (this.loading = false)))
    .subscribe(page => {
      this.data = page.content;
      if (!this.searchCtrl.value) {
        this.updateDataSource(this.data);
      } else {
        const data = this.data.filter(
          x =>
            x.name?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase())
            );
        this.updateDataSource(data);
      }
    })
    this.initSearch();
  }

  initSearch() {
    this.searchCtrl.valueChanges.pipe(startWith(''), takeUntil(this.destroySubscriber$)).subscribe(value => {
      if (!value?.trim()) {
        this.updateDataSource(this.data);
        return;
      }
      const data = this.data.filter(
        x =>
        x.name?.toLowerCase().includes(this.searchCtrl.value?.trim()?.toLowerCase())
      );
      this.updateDataSource(data);
    })
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

  refresh() {
    this.loading = true;
    this.searchCtrl.setValue('')
    this.departmentService
      .getAll()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(page => {
        this.data = page.content;
        this.updateDataSource(this.data)
      })
  }

  updateDataSource(items: Department[]) {
    this.dataSource.data = items;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }
}
