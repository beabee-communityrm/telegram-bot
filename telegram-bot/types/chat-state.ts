/**
 * The current state of the user's session
 * `initial` - The user has not yet seen the welcome message
 * `start` - The user has just started the bot and seen the welcome message
 * `callout:list` - The user has listed the callouts
 * `callout:details` - The user is currently viewing the details of a callout
 * `callout:answer` - The user is currently answering a callout
 * `callout:answered` - The user has answered a callout
 * ... add more if needed
 *
 * @todo Use this for the State Manager
 */
export type _ChatState =
  | "initial"
  | "start"
  | "callout:list"
  | "callout:details"
  | "callout:answer"
  | "callout:answered";
