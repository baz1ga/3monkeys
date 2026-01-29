import 'fastify';
import '@fastify/session';

declare module 'fastify' {
  interface FastifyRequest {
    params: any;
  }
}

declare module '@fastify/session' {
  interface FastifySessionObject {
    user?: { userId: string };
    oauthState?: string;
  }
}
