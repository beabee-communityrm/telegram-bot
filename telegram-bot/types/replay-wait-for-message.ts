export interface ReplayWaitForMessage {
  type: "message";
  /**
   * Define this to wait for a specific message or leave it undefined to wait for any message
   */
  message?: string;
}
