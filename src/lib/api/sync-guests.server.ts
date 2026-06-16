'use server'

import { syncLumaGuests } from "./luma-sync";

export async function syncGuestsFromLuma(eventId: string) {
  return syncLumaGuests(eventId);
}
