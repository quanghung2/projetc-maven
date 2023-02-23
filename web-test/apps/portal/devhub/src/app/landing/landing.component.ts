import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Project, SimpleAppFlowService, SubscriptionForProject } from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { finalize, takeUntil } from 'rxjs/operators';
import { CreateProjectDialogComponent } from './create-project-dialog/create-project-dialog.component';

@Component({
  selector: 'b3n-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  subscriptions: SubscriptionForProject[];

  constructor(private simpleAppFlowService: SimpleAppFlowService, private dialog: MatDialog, private router: Router) {
    super();
  }

  ngOnInit(): void {
    this.loading = true;
    this.simpleAppFlowService
      .getSubscriptions()
      .pipe(takeUntil(this.destroySubscriber$))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(subs => {
        this.subscriptions = subs;
      });
  }

  createProject() {
    this.dialog
      .open(CreateProjectDialogComponent, {
        width: '400px',
        disableClose: true
      })
      .afterClosed()
      .subscribe((project: Project) => {
        if (project) {
          this.router.navigate([project.uuid]);
        }
      });
  }
}
