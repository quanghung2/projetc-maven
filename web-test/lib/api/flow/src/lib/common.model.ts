export enum ActionType {
  API = 'API',
  SUBROUTINE_CALL = 'SUBROUTINE_CALL',
  SUBROUTINE_RETURN = 'SUBROUTINE_RETURN',
  SWITCHING = 'SWITCHING',
  TRANSFORM = 'TRANSFORM',
  DEFINE_CONSTANTS = 'DEFINE_CONSTANTS',
  EXTERNAL = 'API_CUSTOM',
  SET_SHARED_VARIABLE = 'SET_SHARED_VARIABLE',
  GET_SHARED_VARIABLE = 'GET_SHARED_VARIABLE',
  PUSH_SHARED_VARIABLE = 'PUSH_SHARED_VARIABLE',
  POP_SHARED_VARIABLE = 'POP_SHARED_VARIABLE',
  INCREMENT_SHARED_VARIABLE = 'INCREMENT_SHARED_VARIABLE',
  BUSINESS_ACTION_CALL = 'BUSINESS_ACTION_CALL',
  LOOPING_ACTION = 'LOOPING_ACTION'
}

export enum AuthenticationType {
  NO_AUTH = 'NO_AUTH',
  API_KEY_QUERY = 'API_KEY_QUERY',
  API_KEY_HEADERS = 'API_KEY_HEADERS',
  BEARER_TOKEN = 'BEARER_TOKEN',
  BASIC_AUTH = 'BASIC_AUTH'
}

export enum SubTypeVariable {
  StringExp = 'value - string',
  NumberExp = 'value - number',
  BooleanExp = 'value - boolean',
  JsonPathExp = 'value - jsonpath',
  FileExp = 'value - storageFile',
  PlaceholderExp = 'value - placeholder',
  NullExp = 'value - null',

  StringInterpolationExp = 'function - stringConcat',
  ArrayOfValuesExp = 'function - arrayOfValues',
  ActionResponseExp = 'function - actionResponses',
  FlowStaticVarExp = 'function - flowStaticVar',
  TriggerOutputExp = 'function - triggerOutput',
  ConnectorUserParamsExp = 'function - connectorUserParams',
  ExecutionVarExp = 'function - executionVar',
  UserPropertiesVarExp = 'function - userProperties',
  GetLoopItemExp = 'function - getLoopItem'
}

export enum RenderDirectiveType {
  File = 'renderDirective - file',
  SingleSelect = 'renderDirective - singleSelect',
  SuggestiveSingleSelect = 'renderDirective - suggestiveSingleSelect',
  RadioList = 'renderDirective - radioList',
  CheckBox = 'renderDirective - checkbox'
}

export interface ExpressionTree {
  type: string;
  value?: string | boolean | number;
  arguments?: ExpressionTree[];
  label?: string;
  actualFileName?: string;
}

export interface OptionForControl {
  title: string;
  key: string;
  required: boolean;
  isOptional: boolean;
  dataType: string;
  arrayItemDataType: string;
  selectAllDynamicVar: boolean;
  disabled: boolean;
  expressionTree: ExpressionTree;
  defaultValueTree: ExpressionTree;
  visibilityDep: VisibilityDep;
  customRegexValidation: RegexValidation;
  visible: boolean;
}

export interface Mapping {
  key: string;
  expressionTree: ExpressionTree;
  arrayItemsMappings?: [Mapping[]];
}

export interface ArrItemTemplate {
  template: string;
  parameters: BodyParameter[];
}

export interface Parameters {
  parameters: BodyParameter[];
}

export interface ConfigStaticDataSource {
  value: string;
  valueDataType: string;
  label: string;
}

export interface RenderDirective {
  type: RenderDirectiveType;
  supportedMimeTypes?: string[];
  valueListUuid?: string;
}

export interface ConditionVisibilityDep {
  key: string;
  values: string[];
}

export interface VisibilityDep {
  conditions: ConditionVisibilityDep[];
  requiredWhenShow: boolean;
}

export interface RegexValidation {
  pattern: string;
  description: string;
}

export interface BodyParameter {
  dataType: string;
  dataTypeFake: string;
  defaultValue: string;
  defaultValueTree: ExpressionTree;
  description: string;
  key: string;
  title: string;
  hidden: boolean;
  required: boolean;
  arrayItemsMappings: BodyParameter[];
  arrayItemDataType?: string;
  arrItemTemplate?: ArrItemTemplate;
  arrItemUniqueAcrossTriggers?: boolean;
  isOptional: boolean;
  renderDirective: RenderDirective;
  visibilityDep: VisibilityDep;
  customRegexValidation: RegexValidation;
  visible: boolean;
}

export interface Output {
  dataType: string;
  description: string;
  path: string;
  title: string;
  selectionDataSourceUuid: string;
  arrayItemProps: Output[];
  arrayItemDataType: string;
}

export interface OutputContextVariable {
  data: ExpressionTree;
  type?: string;
  dataType?: string;
  arrayItemDataType?: string;
}

export interface ExtractJsonPropRes {
  arrayItemDataType: string;
  arrayItemDescriptions: ExtractJsonPropRes[];
  dataType: string;
  path: string;
}

export interface ItemParamTemplate {
  id: string;
  title: string;
  description: string;
  dataType: string;
  expressionTree: ExpressionTree;

  //support for UI
  selected: boolean;
  paramId: string;
  initTitle: string;
  initValue: string | boolean | number;
  useInitValue: boolean;
}
