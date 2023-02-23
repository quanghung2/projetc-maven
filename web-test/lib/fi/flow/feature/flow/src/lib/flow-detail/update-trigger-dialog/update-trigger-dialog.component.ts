import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ResolveDependencyInput, Trigger, TriggerQuery } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-update-trigger-dialog',
  templateUrl: './update-trigger-dialog.component.html',
  styleUrls: ['./update-trigger-dialog.component.scss']
})
export class UpdateTriggerDialogComponent implements OnInit {
  trigger: Trigger;
  showResolveDependency: boolean;
  dataOfResolve: ResolveDependencyInput;

  constructor(
    public dialogRef: MatDialogRef<UpdateTriggerDialogComponent>,
    private cdr: ChangeDetectorRef,
    private triggerQuery: TriggerQuery,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.trigger = this.triggerQuery.getValue();
  }

  resultResolve(e) {
    if (e?.isDependency) {
      this.showResolveDependency = false;
      this.cdr.detectChanges();
      this.dataOfResolve.dependencys = e.dependencies;
      this.dataOfResolve.newTriggerOutputProperties = e.newTriggerOutputProperties;
      this.showResolveDependency = true;
    } else {
      this.toastService.success('Event has been updated');
      this.dialogRef.close(true);
    }
  }
}
