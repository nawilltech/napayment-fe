import "server-only";
import { createBackendClients } from "@napayment/bff/backend";
import { getSession } from "./session";

export const { publicBackendClient, authedBackendClient } = createBackendClients(getSession);
