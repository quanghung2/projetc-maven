export interface NetCap {
  duration: number;
  filename: string;
  node: string;
  starttime: string;
  tag: string;
}

export interface FilterDoNetCap {
  net: string;
}

export interface DoNetCapReq {
  tag: string;
  duration: number;
  nodes: string[];
  filters: FilterDoNetCap;
}
