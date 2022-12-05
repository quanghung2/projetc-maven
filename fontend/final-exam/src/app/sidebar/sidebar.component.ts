import { Component, OnInit  } from '@angular/core';

export interface MenuSidebar {
  key: string;
  value: string;
  order?: number;
}
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isLoading: boolean;
  menus: MenuSidebar[] = [
    { key: 'account', value: 'Account', order: 0 },
    { key: 'department', value: 'Department', order: 1 },
  ];

  constructor() { }

  ngOnInit(): void {
    this.isLoading = true;
  }
}
