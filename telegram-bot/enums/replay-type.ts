export enum ReplayType {
  /** Accept text message */
  TEXT = "text",
  /** Accept file message */
  FILE = "file",
  /** Accept any message */
  ANY = "any",
  /** Select one of one or more options */
  SELECTION = "selection",
  /** Accept or wait for callout answer replay */
  CALLOUT_COMPONENT_SCHEMA = "callout-component-schema",
  /** No answer is needed */
  NONE = "none",
  /** Accept callback query */
  CALLBACK_QUERY_DATA = "callback_query",
}
