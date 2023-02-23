import { Component, Input, OnInit } from '@angular/core';
import { Me } from '@b3networks/api/callcenter';

@Component({
  selector: 'b3n-permission-denied',
  templateUrl: './permission-denied.component.html',
  styleUrls: ['./permission-denied.component.scss']
})
export class PermissionDeniedComponent implements OnInit {
  @Input() me: Me;

  constructor() {}

  ngOnInit() {}

  goExtension() {}
}
