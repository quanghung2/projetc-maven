import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { BlockRef, GoBlock, NodeEntry, Tree } from '@b3networks/api/ivr';
import * as _ from 'lodash';
import { TreeService } from '../../../core/service/tree.service';

@Component({
  selector: 'b3n-go',
  templateUrl: './go.component.html',
  styleUrls: ['./go.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class GoComponent implements OnInit, OnChanges {
  @Input() tree: Tree;
  @Input() block: GoBlock = new GoBlock();

  nodes: NodeEntry[] = [];

  public query: string;
  public nodeMap: any = {};

  constructor(private treeService: TreeService) {}

  ngOnInit() {
    if (!this.block.goBlock) {
      this.block.goBlock = new BlockRef();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.tree) {
      this.nodes = this.tree.nodes;
      this.nodes = _.filter(this.nodes, (item: NodeEntry) => {
        return item.label !== undefined && item.label != null && item.label.length > 0;
      });

      this.nodeMap = this.treeService.getNodeMap(this.tree);
    }
  }

  selectionChange(event: MatSelectChange) {
    this.block.goBlock.label = this.nodeMap[this.block.goBlock.nextBlockUuid].label;
  }
}
