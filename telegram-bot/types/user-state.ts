/**
 * The current state of the user's session
 * `initial` - The user has not yet seen the welcome message
 * `start` - The user has just started the bot and seen the welcome message
 * `list-callouts` - The user has listed the callouts
 * `callout-details` - The user is currently viewing the details of a callout
 * `answer-callout` - The user is currently answering a callout
 * `answered-callout` - The user has answered a callout
 * ... add more if needed
 *
 * @todo Use this for the State Manager
 */
export type UserState =
  | "initial"
  | "start"
  | "list-callouts"
  | "callout-details"
  | "answer-callout"
  | "answered-callout";
