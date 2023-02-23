import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FlowQuery, FlowService, TreeNode } from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { debounceTime, map, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-overview-tree',
  templateUrl: './overview-tree.component.html',
  styleUrls: ['./overview-tree.component.scss']
})
export class OverViewTreeComponent extends DestroySubscriberComponent implements OnInit {
  trees: TreeNode[] = [];
  searchAction = new UntypedFormControl('');
  dataSearch: TreeNode[] = [];

  constructor(private flowService: FlowService, private flowQuery: FlowQuery, private route: ActivatedRoute) {
    super();
  }

  ngOnInit(): void {
    this.route.params.subscribe(param => {
      this.flowService.getMenuTree(param?.['flowUuid'], param?.['version']).subscribe();
    });

    this.flowQuery
      .select(flow => flow.ui.nodeTrees)
      .pipe(
        takeUntil(this.destroySubscriber$),
        map(nodeTrees => {
          this.initData(nodeTrees);
          return nodeTrees;
        })
      )
      .subscribe(nodeTrees => {
        this.dataSearch = [];
        this.trees = nodeTrees || [];
      });

    this.flowQuery
      .select(flow => flow.ui.treeNodeSelected)
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(node => {
          if (node?.isScrollGotoElement) {
            setTimeout(() => {
              const id = node.pathId;
              const el = document.getElementById('menuTree' + id);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 250);
          }
        })
      )
      .subscribe();

    this.searchAction.valueChanges
      .pipe(
        debounceTime(300),
        tap(value => {
          this.onFilterData(value?.trim());
        })
      )
      .subscribe();
  }

  onFilterData(value: string) {
    this.flowService.resetTreeNodeSelected();
    this.dataSearch = [];
    this.setVisibleItem(value?.trim(), this.trees);
    this.goToFirstElement();
  }

  goToFirstElement() {
    if (this.dataSearch.length) {
      const id = this.dataSearch[0].actionUuid || this.dataSearch[0].pathId;
      const el = document.getElementById('menuTree' + id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  onSelectedData() {
    this.dataSearch = [];
    this.setVisibleItem('', this.trees);
  }

  private initData(nodeTrees: TreeNode[]) {
    nodeTrees?.forEach(item => {
      if (item.nodeType === 'SUBROUTINE_TRIGGER') {
        item.subroutineUuid = 'subroutine';
        item.name = 'When triggered by other flow';
      }
      if (item.nodeType === 'BUSINESS_ACTION_TRIGGER') {
        item.name = 'Business action';
      }
      item.isExpand = item?.isExpand === undefined ? true : item?.isExpand;
      if (item.children?.length) {
        this.initData(item.children);
      }
    });
  }

  private setVisibleItem(value: string, trees: TreeNode[]) {
    trees?.forEach(item => {
      item.isExpand = true;
      const textToSearch = `${item.number}. ${item.name?.toLowerCase()}`;
      if (value?.length && textToSearch.indexOf(value?.toLowerCase()) !== -1) {
        this.dataSearch.push(item);
        item.isVisible = false;
      } else {
        item.isVisible = true;
      }
      if (item.children?.length) {
        this.setVisibleItem(value, item.children);
      }
    });
  }
}
