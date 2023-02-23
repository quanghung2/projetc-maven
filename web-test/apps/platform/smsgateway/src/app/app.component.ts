import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  readonly links = [
    {
      label: 'Vendor Management',
      link: 'vendor-management'
    },
    {
      label: 'Routing Configuration',
      link: 'route-config'
    }
  ];

  ngOnInit(): void {}
}
