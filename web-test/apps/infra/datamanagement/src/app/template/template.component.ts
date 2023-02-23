import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { Template, TemplateQuery, TemplateService } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { finalize } from 'rxjs/operators';
import { DownloadReportComponent } from './download-template/download-template.component';
import { UpdateTemplateComponent } from './update-template/update-template.component';

@Component({
  selector: 'b3n-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent extends DestroySubscriberComponent implements OnInit {
  displayColumns = ['code', 'label', 'descriptor', 'type', 'config', 'action'];
  isLoading: boolean = true;
  dataSource = new MatTableDataSource<Template>();
  templates: Template[];
  templatesFiltered: Template[];
  search: string = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private templateService: TemplateService,
    private templateQuery: TemplateQuery,
    private router: Router,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.templateService.getTemplates().subscribe();
    this.templateQuery.templates$.pipe(finalize(() => (this.isLoading = false))).subscribe(
      templates => {
        this.templates = templates;
        if (templates.length > 0) {
          this.filterTemplates();
        }
        this.isLoading = false;
      },
      err => {
        this.isLoading = false;
        this.toastService.error(err.message);
      }
    );
  }

  filterTemplates() {
    this.templatesFiltered = cloneDeep(this.templates);
    if (this.search) {
      this.templatesFiltered = this.templatesFiltered.filter(
        source =>
          source.label?.toUpperCase().indexOf(this.search.toUpperCase().trim()) !== -1 ||
          source.code?.toUpperCase().indexOf(this.search.toUpperCase().trim()) !== -1
      );
    }
    this.dataSource.data = this.templatesFiltered;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 0);
  }

  getValuePeriod(config: object) {
    return Object.keys(config)[0];
  }

  openSourceTab(descriptor: string) {
    this.router.navigate(['source', { descriptor: descriptor }]);
  }

  updateTemplate(template?: Template) {
    this.dialog.open(UpdateTemplateComponent, {
      width: '1500px',
      data: template || null
    });
  }

  onShowDownload(template?: Template) {
    this.dialog.open(DownloadReportComponent, {
      width: '500px',
      data: template
    });
  }

  refresh() {
    this.isLoading = true;
    this.templateService.getTemplates().subscribe();
  }

  confirmDeleteTemplate(template?: Template) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '50rem',
        data: <ConfirmDialogInput>{
          title: 'Delete Template',
          message: 'Are you sure you want to delete this report template?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteTemplate(template);
        }
      });
  }

  deleteTemplate(template: Template) {
    this.templateService.deleteTemplate(template).subscribe(
      res => {
        this.toastService.success('Delete successfully');
      },
      err => {
        this.toastService.error(err.message);
      }
    );
  }
}
