import {
  createPagieraRouteHandlers,
  pagieraConfigFromEnv,
} from "pagiera/server";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

const handlers = createPagieraRouteHandlers(pagieraConfigFromEnv());

export const { GET, POST, PUT, PATCH, DELETE } = handlers;
