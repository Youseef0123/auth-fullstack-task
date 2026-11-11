import type { Server } from 'node:http';
import request, { Response, Test } from 'supertest';

interface RequestMethods {
  get(url: string): Test;
  post(url: string): Test;
}

/**
 * Thin supertest wrapper that records every response so specs can assert
 * global properties (e.g. no password leaks) after each test.
 */
export class HttpClient implements RequestMethods {
  readonly responses: Response[] = [];

  constructor(private readonly server: Server) {}

  get(url: string): Test {
    return this.track(request(this.server).get(url));
  }

  post(url: string): Test {
    return this.track(request(this.server).post(url));
  }

  /** A cookie-persisting client, like a browser session. */
  agent(): RequestMethods {
    const agent = request.agent(this.server);
    return {
      get: (url) => this.track(agent.get(url)),
      post: (url) => this.track(agent.post(url)),
    };
  }

  private track(test: Test): Test {
    return test.on('response', (response: Response) => {
      this.responses.push(response);
    });
  }
}
