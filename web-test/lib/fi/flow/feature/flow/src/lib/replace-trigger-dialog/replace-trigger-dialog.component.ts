import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Flow, FlowQuery, ResolveDependencyInput, TriggerDef, TriggerReq, TriggerService } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface ReplaceTriggerDialogReq {
  replace?: boolean;
  isDeprecated?: boolean;
  isTrigger?: boolean;
  isShowOnlyParameter?: boolean;
  triggerDef: TriggerDef;
}

@Component({
  selector: 'b3n-replace-trigger-dialog',
  templateUrl: './replace-trigger-dialog.component.html',
  styleUrls: ['./replace-trigger-dialog.component.scss']
})
export class ReplaceTriggerDialogComponent implements OnInit {
  flow: Flow;
  replaceTriggerInput: ReplaceTriggerDialogReq;
  showResolveDependency: boolean;
  dataOfResolve: ResolveDependencyInput;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ReplaceTriggerDialogReq,
    private dialogRef: MatDialogRef<ReplaceTriggerDialogComponent>,
    private triggerService: TriggerService,
    private toastService: ToastService,
    private flowQuery: FlowQuery,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.flow = this.flowQuery.getValue();
    this.replaceTriggerInput = this.data;
  }

  onTriggerData(body: TriggerReq, triggerName: string) {
    this.triggerService.replaceTrigger(this.flow.uuid, this.flow.version, body).subscribe({
      next: res => {
        if (res?.dependencies?.length) {
          this.showResolveDependency = true;
          this.dataOfResolve = <ResolveDependencyInput>{
            dependencys: res.dependencies,
            replace: true,
            replaceTriggerData: body,
            newTriggerName: triggerName,
            isTrigger: true,
            newTriggerOutputProperties: res.newTriggerOutputProperties
          };
        } else {
          this.toastService.success('Event has been replaced');
          this.dialogRef.close(true);
        }
      },
      error: error => {
        this.toastService.error(error.message);
      }
    });
  }

  resultResolve(e) {
    if (e?.isDependency) {
      this.showResolveDependency = false;
      this.cdr.detectChanges();
      this.dataOfResolve.dependencys = e.dependencies;
      this.dataOfResolve.newTriggerOutputProperties = e.newTriggerOutputProperties;
      this.showResolveDependency = true;
    } else {
      this.toastService.success('Event has been replaced');
      this.dialogRef.close(true);
    }
  }
}
