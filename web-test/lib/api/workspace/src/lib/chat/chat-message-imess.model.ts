// https://b3networks.atlassian.net/wiki/spaces/WOR/pages/2027388990/Interactive+Message#Supported-Components

export interface IMessBodyData {
  components: IMessComponent[];
  version: string;
}

export interface IMessComponent {
  type: IMessType;

  // for input + button
  label: {
    display: IMessLabelDisplay;
    text: string;
  };

  // for form  + button
  action_url: string;

  // for section + form
  components: IMessComponent[];

  // text
  display: IMessLabelDisplay;
  text: string;

  // input
  element: IMessElementInput;

  //  form
  auto_submit: boolean;
  submit_btn_text: string;
  title: string; // title dialog

  //  button
  color: string;
}

export interface IMessElementInput {
  type: IMessElementType;
  id: string; // key
  placeholder: string;

  // select
  default_option_value: string;
  options: {
    text: string;
    value: string;
  }[];

  // plain_text
  default_value: string;
  min_length: number;
  max_length: number;
  multiline: boolean; // for textarea

  // file
  folder: string;
}

export enum IMessType {
  text = 'text',
  input = 'input',
  button = 'button',
  section = 'section',
  form = 'form'
}

export enum IMessElementType {
  select = 'select',
  plain_text = 'plain_text',
  number = 'number',
  file = 'file'
}

export enum IMessLabelDisplay {
  plain = 'plain',
  md = 'md' // markdown
}
