import "server-only";

import { Client, Messaging, Users } from "node-appwrite";
import { getAppwriteApiKey, getAppwritePublicConfig } from "./env";

/** Server admin client (API key). Use only from Route Handlers / server code. */
export function createAppwriteAdmin() {
  const { endpoint, projectId } = getAppwritePublicConfig();
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(getAppwriteApiKey());

  return {
    client,
    messaging: new Messaging(client),
    users: new Users(client),
  };
}
