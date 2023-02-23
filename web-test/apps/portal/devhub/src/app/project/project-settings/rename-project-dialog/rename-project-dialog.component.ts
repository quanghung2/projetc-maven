import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateProjectReq, Project, ProjectService } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-rename-project-dialog',
  templateUrl: './rename-project-dialog.component.html',
  styleUrls: ['./rename-project-dialog.component.scss']
})
export class RenameProjectDialogComponent implements OnInit {
  updating: boolean;
  nameCtrl = new UntypedFormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) private project: Project,
    private dialogRef: MatDialogRef<RenameProjectDialogComponent>,
    private projectService: ProjectService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.nameCtrl.setValue(this.project.name);
  }

  update() {
    if (this.nameCtrl.valid) {
      this.updating = true;
      this.projectService
        .updateProject(this.project.uuid, <CreateProjectReq>{
          name: this.nameCtrl.value,
          subUuid: this.project.subscriptionUuid,
          capabilities: this.project.capabilities
        })
        .pipe(finalize(() => (this.updating = false)))
        .subscribe(
          _ => {
            this.toastService.success('Project has been renamed');
            this.dialogRef.close(true);
          },
          error => {
            this.toastService.error(error.message);
          }
        );
    }
  }
}
