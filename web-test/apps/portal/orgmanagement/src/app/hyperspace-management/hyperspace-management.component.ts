import { KeyValue } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatDrawer } from '@angular/material/sidenav';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import {
  Hyperspace,
  HyperspaceQuery,
  HyperspaceService,
  MeQuery,
  StatusHyperspace,
  UserService
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, filter, map, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { CreateHyperspaceComponent } from './create-hyperspace/create-hyperspace.component';

@Component({
  selector: 'b3n-hyperspace-management',
  templateUrl: './hyperspace-management.component.html',
  styleUrls: ['./hyperspace-management.component.scss']
})
export class HyperspaceManagementComponent extends DestroySubscriberComponent implements OnInit {
  readonly statusOpt: KeyValue<StatusHyperspace, string>[] = [
    { key: StatusHyperspace.all, value: 'All' },
    { key: StatusHyperspace.active, value: 'Connected' },
    { key: StatusHyperspace.pending, value: 'Pending' },
    { key: StatusHyperspace.waiting, value: 'Waiting' }
  ];
  readonly StatusHyperspace = StatusHyperspace;
  readonly columns = ['orgUuid', 'name', 'createdAt', 'acceptedAt', 'status', 'action'];

  currentOrg = X.orgUuid;
  hyperspaces$: Observable<MatTableDataSource<Hyperspace>>;
  selectedHyper: Hyperspace;
  isUperAdmin$: Observable<boolean>;
  group = this.fb.group({
    status: StatusHyperspace.all,
    search: ''
  });
  isOwner$: Observable<boolean>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('sidenav') sidenav: MatDrawer;

  constructor(
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private identityProfileQuery: IdentityProfileQuery,
    private hyperspaceQuery: HyperspaceQuery,
    private hyperspaceService: HyperspaceService,
    private dialog: MatDialog,
    private meQuery: MeQuery,
    private userService: UserService
  ) {
    super();
  }

  ngOnInit() {
    this.userService.fetchAllUsers().subscribe();
    this.userService.getMe().subscribe();

    this.identityProfileQuery.currentOrg$
      .pipe(
        filter(x => x != null),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(org => {
        if (org.isUpperAdmin) {
          this.hyperspaceService
            .getHyperspacesByOrg(X.orgUuid)
            .pipe(switchMap(() => this.hyperspaceService.getHyperspacesByMember(X.orgUuid)))
            .subscribe();
        } else {
          this.hyperspaceService.getHyperspacesByMember(X.orgUuid).subscribe();
        }
      });

    this.isUperAdmin$ = this.identityProfileQuery.currentOrg$.pipe(map(org => org.isUpperAdmin));
    this.isOwner$ = this.identityProfileQuery.currentOrg$.pipe(map(org => org.isOwner));

    this.hyperspaces$ = this.group.valueChanges.pipe(
      startWith({
        status: StatusHyperspace.all,
        search: ''
      }),
      debounceTime(300),
      switchMap(({ status, search }) =>
        this.hyperspaceQuery.selectHyperspaceByFilter(search, status).pipe(map(data => new MatTableDataSource(data)))
      ),
      tap(datatable => {
        datatable.paginator = this.paginator;
      })
    );
  }

  showDetail(hyper: Hyperspace, event: Event) {
    event.stopPropagation();

    if (hyper.status === StatusHyperspace.active) {
      this.selectedHyper = hyper;

      if (this.sidenav) {
        this.sidenav.open();
      }
    }
  }

  onCreateHyperpsace() {
    this.dialog.open(CreateHyperspaceComponent, {
      width: '600px'
    });
  }

  trackTask(index: number, item: Hyperspace): string {
    return item.id;
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  onReject(item: Hyperspace) {
    // this.hyperspaceService.rejectHyperspace(item.id).subscribe(
    //   data => {
    //   },
    //   err => this.toastService.error(err?.message)
    // );
  }

  onAccept(item: Hyperspace) {
    this.hyperspaceService.acceptHyperspace(item.id, X.orgUuid).subscribe(
      data => {
        console.log('data: ', data);
      },
      err => this.toastService.error(err?.message)
    );
  }
}
