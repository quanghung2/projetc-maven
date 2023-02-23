import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AgentStatus, Me, MeService } from '@b3networks/api/callcenter';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-settings-status',
  templateUrl: './settings-status.component.html',
  styleUrls: ['./settings-status.component.scss']
})
export class SettingsStatusComponent extends DestroySubscriberComponent implements OnInit {
  readonly status = [
    { key: AgentStatus.available, value: 'Available' },
    { key: AgentStatus.busy, value: 'Busy' },
    { key: AgentStatus.dnd, value: 'Away' },
    { key: AgentStatus.offline, value: 'Offline' }
  ];

  saving: boolean;
  start = true;

  constructor(
    private meService: MeService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<SettingsStatusComponent>
  ) {
    super();
  }

  ngOnInit(): void {}

  close() {
    document.getElementsByClassName('animate__animated')[0].classList.remove('animate__slideInUp');
    document.getElementsByClassName('animate__animated')[0].classList.add('animate__slideOutDown');

    setTimeout(() => {
      this.dialogRef.close();
    }, 500);
  }

  save(status: string) {
    this.saving = true;
    let action$: Observable<Me>;

    switch (status) {
      case AgentStatus.available:
        action$ = this.meService.login(null);
        break;

      case AgentStatus.busy:
        action$ = this.meService.makeBusy(null);
        break;

      case AgentStatus.dnd:
        action$ = this.meService.dnd();
        break;

      case AgentStatus.offline:
        action$ = this.meService.logout();
        break;

      default:
        break;
    }

    action$
      .pipe(
        finalize(() => {
          this.saving = false;
          this.close();
        })
      )
      .subscribe(
        _ => this.toastService.success('Change status successfully'),
        error => {
          this.toastService.warning(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }
}
