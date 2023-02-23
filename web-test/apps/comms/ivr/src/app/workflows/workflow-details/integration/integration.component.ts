import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'b3n-integration',
  templateUrl: './integration.component.html',
  styleUrls: ['./integration.component.scss']
})
export class IntegrationComponent implements OnInit {
  integrations = [
    {
      integrationType: 'ZENDESK',
      integrationName: 'Zendesk',
      imageURL: '../../../../assets/images/zendesk_128.png'
    },
    {
      integrationType: 'USERVOICE',
      integrationName: 'Uservoice',
      imageURL: '../../../../assets/images/uservoice_128.png'
    },
    {
      integrationType: 'DESK',
      integrationName: 'Desk.com',
      imageURL: '../../../../assets/images/desk_128.png'
    },
    {
      integrationType: 'FRESHDESK',
      integrationName: 'Freshdesk',
      imageURL: '../../../../assets/images/freshdesk.png'
    },
    {
      integrationType: 'AGILECRM',
      integrationName: 'AgileCRM',
      imageURL: '../../../../assets/images/agilecrm.png'
    }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {}

  settingDetail(integration) {
    //todo not implemented
    //   this.router.navigate(['details', integration.integrationType], { relativeTo: this.route });
  }
}
