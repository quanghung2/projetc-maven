import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorActionDef,
  AuthorConnector,
  AuthorConnectorQuery,
  AuthorDataSource,
  AuthorService,
  AuthorTriggerDef
} from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { forkJoin, Observable } from 'rxjs';
import { finalize, takeUntil, tap } from 'rxjs/operators';
import { ConnectorDialogComponent } from '../connector-dialog/connector-dialog.component';
import {
  CreateDefinitionDialogComponent,
  CreateDefinitionDialogInput
} from '../create-definition-dialog/create-definition-dialog.component';

@Component({
  selector: 'b3n-connector-detail',
  templateUrl: './connector-detail.component.html',
  styleUrls: ['./connector-detail.component.scss']
})
export class ConnectorDetailComponent extends DestroySubscriberComponent implements OnInit {
  connector: AuthorConnector;

  showTriggerDef: boolean;
  showActionDef: boolean;
  showDataSource: boolean;

  loading: boolean;

  createTrigger: boolean;
  createAction: boolean;
  createDataSource: boolean;

  triggerDefs: AuthorTriggerDef[];
  editingTriggerDef: AuthorTriggerDef;

  actionDefs: AuthorActionDef[];
  editingActionDef: AuthorActionDef;

  dataSources: AuthorDataSource[];
  editingDataSource: AuthorDataSource;

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private authorConnectorQuery: AuthorConnectorQuery,
    private authorService: AuthorService
  ) {
    super();
  }

  ngOnInit(): void {
    this.authorConnectorQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(connector => {
        if (connector.uuid) {
          this.connector = connector;
          this.loadListDef('', true);
        } else {
          this.activatedRoute.params.subscribe(params => {
            if (params['uuid']) {
              this.authorService.getConnector(params['uuid']).subscribe();
            }
          });
        }
      });
  }

  tabChange(index: number) {
    switch (index) {
      case 0:
        this.showTriggerDef = true;
        this.showActionDef = false;
        this.showDataSource = false;
        break;
      case 1:
        this.showTriggerDef = false;
        this.showActionDef = true;
        this.showDataSource = false;
        break;
      case 2:
        this.showTriggerDef = false;
        this.showActionDef = false;
        this.showDataSource = true;
        break;
    }
  }

  loadListDef(tab: string, firstLoad = false) {
    this.loading = true;
    forkJoin([
      this.authorService.getListTriggerDef(this.connector.uuid),
      this.authorService.getListActionDef(this.connector.uuid),
      this.authorService.getListDataSource(this.connector.uuid)
    ])
      .pipe(
        finalize(() => (this.loading = false)),
        tap(([triggerDefs, actionDefs, dataSources]) => {
          this.triggerDefs = triggerDefs;
          this.actionDefs = actionDefs;
          this.dataSources = dataSources;

          if (firstLoad) {
            if (this.triggerDefs.length > 0) {
              this.tabChange(0);
            } else if (this.actionDefs.length > 0) {
              this.tabChange(1);
            } else {
              this.tabChange(2);
            }
          } else {
            switch (tab) {
              case 'trigger':
                this.tabChange(0);
                break;
              case 'action':
                this.tabChange(1);
                break;
              case 'datasource':
                this.tabChange(2);
                break;
            }
          }
        })
      )
      .subscribe();
  }

  onReload(tab: string) {
    let listDefObservable$: Observable<AuthorTriggerDef[] | AuthorActionDef[]>;

    switch (tab) {
      case 'trigger':
        listDefObservable$ = this.authorService.getListTriggerDef(this.connector.uuid);
        break;
      case 'action':
        listDefObservable$ = this.authorService.getListActionDef(this.connector.uuid);
        break;
    }

    if (listDefObservable$) {
      this.loading = true;
      listDefObservable$.pipe(finalize(() => (this.loading = false))).subscribe(res => {
        switch (tab) {
          case 'trigger':
            this.triggerDefs = <AuthorTriggerDef[]>res;
            this.tabChange(0);
            break;
          case 'action':
            this.actionDefs = <AuthorActionDef[]>res;
            this.tabChange(1);
            break;
        }
      });
    }
  }

  createDefinition() {
    this.dialog
      .open(CreateDefinitionDialogComponent, {
        width: '600px',
        panelClass: 'fif-dialog',
        disableClose: true,
        data: <CreateDefinitionDialogInput>{
          connector: this.connector
        }
      })
      .afterClosed()
      .subscribe((type: string) => {
        switch (type) {
          case 'trigger':
            this.createTrigger = true;
            break;
          case 'action':
            this.createAction = true;
            break;
          case 'datasource':
            this.createDataSource = true;
            break;
        }
      });
  }

  editConnector() {
    this.dialog.open(ConnectorDialogComponent, {
      width: '500px',
      panelClass: 'fif-dialog',
      disableClose: true,
      autoFocus: false
    });
  }

  backToList() {
    this.router.navigate(['../setting'], { relativeTo: this.activatedRoute.parent, queryParams: { tab: 'connector' } });
  }
}
