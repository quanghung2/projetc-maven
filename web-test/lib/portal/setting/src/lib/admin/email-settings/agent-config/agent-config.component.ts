import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { User, UserQuery, UserService } from '@b3networks/api/workspace';
import { filter, takeUntil } from 'rxjs/operators';
import { AddAgentDialogComponent } from './add/add-agent-dialog.component';
import { DestroySubscriberComponent } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-agent-configuration',
  templateUrl: './agent-config.component.html',
  styleUrls: ['./agent-config.component.scss']
})
export class AgentConfigComponent extends DestroySubscriberComponent implements AfterViewInit {
  agents: User[] = [];
  displayedColumns = ['photoUrl', 'displayName', 'email', 'action'];
  dataSource: MatTableDataSource<User> = new MatTableDataSource<User>(this.agents);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  constructor(private userService: UserService, private dialog: MatDialog, private userQuery: UserQuery) {
    super();
  }

  ngAfterViewInit() {
    this.userQuery
      .selectAllAgents()
      .pipe(
        filter(agents => !!(agents && agents.length)),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(agents => {
        this.agents = agents;
        this.updateDataSource();
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: User, value: string): boolean => {
      return data.displayName.toLowerCase().indexOf(value) > -1 || data.email.toLowerCase().indexOf(value) > -1;
    };
  }

  addAgents() {
    this.dialog.open(AddAgentDialogComponent, {
      width: '600px',
      data: this.agents
    });
  }

  remove(agent: User) {

  }

  private updateDataSource() {
    this.dataSource = new MatTableDataSource<User>(this.agents);
    this.dataSource.paginator = this.paginator;
  }
}
