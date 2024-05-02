import { BaseService } from "../core/index.ts";
import { djwt, Singleton } from "../deps/index.ts";
import { createSecretKeyFromSecret, extractToken } from "../utils/index.ts";
import { EventService } from "./event.service.ts";
import { BeabeeContentService } from "../services/beabee-content.service.ts";
import { NetworkCommunicatorEvents } from "../enums/index.ts";

import type {
  EventNetworkCommunicatorReloadData,
  EventTelegramBotListener,
  NetworkServiceMap,
} from "../types/index.ts";

/**
 * A service for internal network communication based on the `NetworkCommunicatorService` of beabee.
 * @see https://github.com/beabee-communityrm/beabee/blob/1140fb602a978b01fd518ebd772452b8240b7880/src/core/services/NetworkCommunicatorService.ts
 */
@Singleton()
export class NetworkCommunicatorService extends BaseService {
  private server?: Deno.HttpServer;

  private secretKey?: CryptoKey;

  private services: NetworkServiceMap = {
    // At the moment the telegram bot does not require the ability to contact other services
  };

  constructor(
    protected readonly event: EventService,
    protected readonly beabeeContent: BeabeeContentService,
  ) {
    super();
    const secret = Deno.env.get("BEABEE_SERVICE_SECRET");
    if (!secret) {
      throw new Error("No service secret found");
    }

    createSecretKeyFromSecret(secret).then((secretKey) => {
      this.secretKey = secretKey;
    });
  }

  /**
   * Sign a internal service request
   * @param payload
   * @returns
   */
  private async sign(payload: djwt.Payload = {}) {
    if (!this.secretKey) {
      throw new Error("No secret key");
    }

    return await djwt.create(
      { alg: "HS256", typ: "JWT" },
      payload,
      this.secretKey,
    );
  }

  /**
   * Verify a internal service request
   * @param token
   * @returns The payload decoded if the signature is valid and optional expiration, audience, or issuer are valid.
   * @throws If not valid, it will throw an Error
   */
  private verify(authHeader?: string | null) {
    if (!this.secretKey) {
      throw new Error("No secret key");
    }
    const token = extractToken(authHeader);
    if (!token) {
      throw new Error("No token found");
    }
    return djwt.verify(token, this.secretKey);
  }

  public on<T = djwt.Payload>(
    eventName: string,
    callback: EventTelegramBotListener<T>,
  ) {
    return this.event.on<T>(eventName, callback);
  }

  public once<T = djwt.Payload>(
    eventName: string,
    callback: EventTelegramBotListener<T>,
  ) {
    return this.event.once<T>(eventName, callback);
  }

  public off<T = djwt.Payload>(
    eventName: string,
    callback: EventTelegramBotListener<T>,
  ) {
    return this.event.off<T>(eventName, callback);
  }

  /**
   * Start the internal server
   */
  public startServer() {
    console.debug("Start server...");
    const reloadRoute = new URLPattern({ pathname: "/books/:id" });
    this.server = Deno.serve({ port: 4000 }, (req: Request) => {
      const method = req.method;
      const match = reloadRoute.exec(req.url);
      if (match && method === "POST") {
        return this.onInternalServiceRequest(req);
      }
      return new Response("Not found", {
        status: 404,
      });
    });

    return this.server;
  }

  /**
   * Called if this service is notified from other internal service to a registered route
   * * Verifies the request token
   * * If the request is authenticated, it will emit the event with the payload
   * @throws JsonWebTokenError if the request is not authenticated
   * @emits reload The `reload` event with the payload
   * @param req
   * @param res
   */
  private async onInternalServiceRequest(req: Request) {
    const url = new URL(req.url);
    // Get the action from request path
    const actionPath = url.pathname.substring(1);
    // Convert action path to event name, e.g. "user:created" if the route is "/user/created" or 'reload' if the route is '/reload'
    const eventName = actionPath.replaceAll("/", ":");
    try {
      const payload = await this.verify(req.headers.get("authorization"));
      if (eventName === "reload") {
        this.emitReload(payload);
      } else {
        throw new Error(`Unknown internal service event "${eventName}"`);
      }
      return new Response(null, {
        status: 200,
      });
    } catch (error) {
      console.error(error);
      return new Response(error.message, {
        status: 401,
      });
    }
  }

  public async emitReload(payload: unknown) {
    const general = await this.beabeeContent.get("general");
    const telegram = await this.beabeeContent.get("telegram");

    const data: EventNetworkCommunicatorReloadData = {
      payload,
      general,
      telegram,
    };

    this.event.emit(
      NetworkCommunicatorEvents.RELOAD,
      data,
    );
  }

  /**
   * Notify an internal service by `serviceName`
   * @param serviceName The name of the service
   * @param actionPath The path of the action
   * @param data The data to send
   * @returns
   */
  private async notify(
    serviceName: string,
    actionPath: string,
    payload: djwt.Payload = {},
  ) {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Internal service "${serviceName}" not found`);
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${await this.sign(payload)}`,
    };

    try {
      return await fetch(`${service.host}/${actionPath}`, {
        method: "POST",
        headers,
      });
    } catch (error) {
      // If the service is optional and the request fails, ignore the error otherwise log it
      if (!service.optional) {
        console.error(
          `[${this.constructor.name}] Failed to notify "${serviceName}" service of options change`,
          error,
        );
      }
    }
  }

  /**
   * Notify all internal services
   * @param actionPath The action path, atm only `reload` is used
   */
  public async notifyAll(
    actionPath: string,
    payload?: djwt.Payload,
  ) {
    for (const serviceName in this.services) {
      await this.notify(serviceName, actionPath, payload);
    }
  }
}
