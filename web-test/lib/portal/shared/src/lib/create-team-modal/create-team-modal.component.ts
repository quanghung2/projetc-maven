import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Team, TeamService } from '@b3networks/api/auth';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface CreateTeamModalInput {
  isEdit: boolean;
  team: Team;
}

@Component({
  selector: 'b3networks-create-team-modal',
  templateUrl: './create-team-modal.component.html',
  styleUrls: ['./create-team-modal.component.scss']
})
export class CreateTeamModalComponent implements OnInit {
  isLoading: boolean;

  name: UntypedFormControl;

  createTeamModalInput: CreateTeamModalInput;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: CreateTeamModalInput,
    private dialogRef: MatDialogRef<CreateTeamModalComponent>,
    private teamService: TeamService,
    private toastService: ToastService
  ) {
    this.createTeamModalInput = data;
    const { isEdit, team } = this.createTeamModalInput;
    this.name = new UntypedFormControl(isEdit ? team.name : '', [Validators.required, Validators.maxLength(100)]);
  }

  ngOnInit(): void {}

  onSave() {
    if (this.name.invalid || this.isLoading) {
      return;
    }

    const { isEdit, team } = this.createTeamModalInput;
    if (isEdit) {
      this.updateTeam(team);
    } else {
      this.createTeam();
    }

    this.dialogRef.close(true);
  }

  private createTeam() {
    this.isLoading = true;
    this.teamService
      .createTeam(X.orgUuid, this.name.value)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        () => {
          this.toastService.success('Create team successfully!');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  private updateTeam(team: Team) {
    const body: Partial<Team> = {
      name: this.name.value.trim()
    };
    this.isLoading = true;
    this.teamService
      .updateTeam(X.orgUuid, team.uuid, body)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.toastService.success('Update team successfully!');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
