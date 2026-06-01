"use server";

import { updateTag } from "next/cache";

export async function refreshAiringData() {
  updateTag("airing-anime");
  updateTag("inori-voices");
}

export async function refreshUpcomingData() {
  updateTag("upcoming-anime");
  updateTag("inori-voices");
}
