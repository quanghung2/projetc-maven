import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  readonly menus = [
    { url: '/genie', title: 'Genie' },
    { url: '/server', title: 'Edge' },
    { url: '/view-route', title: 'View Route' },
    { url: '/b3n-cronjob-mgnt', title: 'Chronos Config' },
    // { url: '/health-check', title: 'Health Check' },
    { url: '/linkages', title: 'Linkages' },
    { url: '/ipphone-provision', title: 'IP Phone Provision' },
    { url: '/cas-config', title: 'CAS Config' },
    { url: '/automation-test', title: 'Automation Test' }
  ];

  constructor() {}

  ngOnInit(): void {}
}
