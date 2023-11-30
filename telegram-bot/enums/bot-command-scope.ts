export enum BotCommandScope {
    /**
     * Default commands are used if no commands with a narrower scope are specified for the user.
     * @see https://core.telegram.org/bots/api#botcommandscopedefault
     */
    Default = "default",
    /**
     * Covering all group and supergroup chat administrators.
     * @see https://core.telegram.org/bots/api#botcommandscopeallgroupchats
     */
    AllChatAdministrators = "all_chat_administrators",
    /**
     * Covering all group and supergroup chats.
     * @see https://core.telegram.org/bots/api#botcommandscopeallprivatechats
     */
    AllGroupChats = "all_group_chats",
    /**
     * Covering all private chats.
     * @see https://core.telegram.org/bots/api#botcommandscopeallprivatechats
     */
    AllPrivateChats = "all_private_chats",
    /**
     * Covering a specific chat.
     * @see https://core.telegram.org/bots/api#botcommandscopechatmember
     */
    Chat = "chat",
    /**
     * Covering all administrators of a specific group or supergroup chat.
     * @see https://core.telegram.org/bots/api#botcommandscopechatadministrators
     */
    ChatAdministrators = "chat_administrators",
    /**
     * Covering a specific member of a group or supergroup chat.
     * @see https://core.telegram.org/bots/api#botcommandscopechatmember
     */
    ChatMember = "chat_member",
}