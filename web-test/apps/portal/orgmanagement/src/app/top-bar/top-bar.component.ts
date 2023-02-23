import { Component, Input, OnInit } from '@angular/core';
import { IdentityProfile, Organization } from '@b3networks/api/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'pom-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss']
})
export class TopBarComponent implements OnInit {
  @Input() organization$: Observable<Organization>;
  @Input() identityProfile$: Observable<IdentityProfile>;
  constructor() {}

  ngOnInit(): void {}
}
