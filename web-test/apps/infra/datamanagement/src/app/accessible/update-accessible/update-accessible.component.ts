import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Accessible, AccessibleService, Template, TemplateQuery, TemplateService } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-accessible',
  templateUrl: './update-accessible.component.html',
  styleUrls: ['./update-accessible.component.scss']
})
export class UpdateAccessibleComponent extends DestroySubscriberComponent implements OnInit {
  ctaActionName: string = 'Create';
  newAccess: Accessible;
  queryType: string;
  templates: Template[];
  filteredTemplates: Template[];
  isLoading: boolean;
  codeTemplate: any;
  hasCode = false;
  statusCode: '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public access: Accessible,
    public dialogRef: MatDialogRef<UpdateAccessibleComponent>,
    private toastService: ToastService,
    private templateService: TemplateService,
    private templateQuery: TemplateQuery,
    private accessibleService: AccessibleService
  ) {
    super();
    if (access) {
      this.newAccess = cloneDeep(access);
      this.ctaActionName = 'Update';
    } else {
      this.newAccess = new Accessible();
    }
  }

  ngOnInit(): void {
    this.templateService.getTemplates().subscribe();
    this.templateQuery.templates$.pipe(finalize(() => (this.isLoading = false))).subscribe(templates => {
      this.templates = templates;
      this.filterReports();
    });
  }

  updateAccessible() {
    if (this.codeTemplate) {
      this.newAccess.code = this.codeTemplate.code;
    }
    this.accessibleService.updateAccessible(this.newAccess).subscribe(
      _ => {
        this.dialogRef.close(true);
        this.toastService.success(this.ctaActionName + ' successfully');
      },
      err => {
        this.toastService.error(err.message);
      }
    );
  }

  setValueType() {
    this.hasCode = true;
    this.newAccess.type = this.codeTemplate?.type || '';
  }

  filterReports() {
    let filterValue = '';
    if (this.codeTemplate) {
      filterValue = this.codeTemplate.toLowerCase() || '';
    }

    this.filteredTemplates = this.templates.filter(temp =>
      temp.label.toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  customReport(template: Template) {
    return template ? template.label : '';
  }
}
