export enum RelayAcceptedFileType {
  AUDIO = "audio", // or voice
  DOCUMENT = "document",
  PHOTO = "photo",
  VIDEO = "video",
  LOCATION = "location", // or venue
  ADDRESS = "address", // this is venue.address
  CONTACT = "contact", // TODO: This could be also interesting for Callout responses
  POLL = "poll", // We could use this for Callout responses
  // The following types are not supported yet
  // ANIMATION = "animation",
  // STICKER = "sticker",
  // GAME = "game",
  // POLL = "poll",
  // DICE = "dice",
  // There are more types ...
  ANY = "any",
}
