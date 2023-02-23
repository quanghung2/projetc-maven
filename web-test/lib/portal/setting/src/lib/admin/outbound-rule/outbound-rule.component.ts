import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'pos-outbound-rule',
  templateUrl: './outbound-rule.component.html',
  styleUrls: ['./outbound-rule.component.scss']
})
export class OutboundRuleComponent implements OnInit {
  fetching = false;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {}
}
