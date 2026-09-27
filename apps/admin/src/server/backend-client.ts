import "server-only";
import { createBackendClients } from "@napayment/bff/backend";
import { sessionStore } from "./session";

export const { publicBackendClient, authedBackendClient } = createBackendClients(sessionStore.getSession);
