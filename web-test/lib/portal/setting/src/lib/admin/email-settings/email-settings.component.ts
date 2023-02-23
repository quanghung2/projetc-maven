import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserQuery, UserService } from '@b3networks/api/workspace';
import { tap } from 'rxjs';

@Component({
  selector: 'b3n-email-setting',
  templateUrl: './email-settings.component.html',
  styleUrls: ['./email-settings.component.scss']
})
export class EmailSettingsComponent implements OnInit {
  readonly links: KeyValue<string, string>[] = [
    { key: 'agent', value: 'Agent Management' },
    { key: 'config', value: 'Mailbox Config' }
  ];

  constructor(
    private userService: UserService,
    private userQuery: UserQuery,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.userService.getMe().subscribe();
    if (!this.userQuery.getAllUsers().length) {
      this.userService
        .fetchAllUsers()
        .pipe(tap(() => this.userService.getAgents().subscribe()))
        .subscribe();
    }
    this.router.navigate(['agent'], { relativeTo: this.route });
  }
}
