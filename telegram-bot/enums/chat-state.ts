export enum ChatState {
  /** The user has not yet seen the welcome message */
  Initial = "initial",
  /** The user has just started the bot and seen the welcome message */
  Start = "start",
  /** The user has listed the callouts */
  CalloutList = "callout:list",
  /** The user has selected a callout to view details */
  CalloutDetails = "callout:details",
  /** The user has selected a callout to answer */
  CalloutAnswer = "callout:answer",
  /** The user has answered the callout */
  CalloutAnswered = "callout:answered",
}
