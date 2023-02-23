import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SipAccount } from '@b3networks/api/callcenter';

export interface DetailAccountInput {
  sip: SipAccount;
  pbxConfig: any;
}

@Component({
  selector: 'b3n-detail-account',
  templateUrl: './detail-account.component.html',
  styleUrls: ['./detail-account.component.scss']
})
export class DetailAccountComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: DetailAccountInput) {}

  ngOnInit(): void {}
}
