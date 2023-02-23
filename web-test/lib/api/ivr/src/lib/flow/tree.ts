import { NodeEntry } from '../block/node-entry';

export class Tree {
  firstBlockUuid: string;
  nodes: NodeEntry[] = [];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  get assignedNumbers2Block() {
    return this.nodes
      .filter(node => node.startNumber)
      .map(node => node.startNumber)
      .toString()
      .split(',');
  }

  getBlockLabel(uuid: string) {
    const block = this.nodes.find(node => node.uuid === uuid);
    return block ? block.label : null;
  }
}
