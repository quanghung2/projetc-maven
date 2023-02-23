import { Component, OnInit } from '@angular/core';
import { User } from '../shared/model';
import { UserService } from '../shared/service';
import { NewComplianceService } from '../shared/service/new-compliance.service';

declare let X: any;

@Component({
  selector: 'app-new-compliance',
  templateUrl: './new-compliance.component.html',
  styleUrls: ['./new-compliance.component.css']
})
export class NewComplianceComponent implements OnInit {
  private user: User;
  public complianceFeatures: any[] = [
    {
      key: 'acl',
      label: 'Access Control Limit'
    },
    {
      key: 'encryption',
      label: 'Encryption'
    }
  ];
  public selectedFeature: string;

  constructor(private userService: UserService, private complianceService: NewComplianceService) {}

  ngOnInit() {
    this.user = this.userService.getCurrentUser();
    this.selectedFeature = this.complianceFeatures[0].key;

    this.initCompliance();
  }

  private initCompliance() {}
}
