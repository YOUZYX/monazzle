import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    "accountAssociation": {
    "header": "eyJmaWQiOjEwNjE4OTgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhhMDQxYjE2OENFMjI4MDhBNDkwMWQ0NzdBYTkyMzg0OWQyMDUzYUUwIn0",
    "payload": "eyJkb21haW4iOiJtb25henpsZS52ZXJjZWwuYXBwIn0",
    "signature": "MHgxN2U3YWU5Y2FlNjY3YmY3YTg0NDBiNmU1NWIzYTU4MThhODE4MDhjNmRiMGE3YzFiMWM5MGZkNDJjOWU2MjMxNzU1NWRjYjI0MzA2ZDRhYjM5MDVlYTU4Y2NiNzA3NGJiMmViMGM5ZTE5YTJiNzVlNmRiZDkxNTNmMGYwYTY1NzFj"
  },
    "frame": {
      "version": "1",
      "name": "Monazzle",
      "iconUrl": `${APP_URL}/images/monazzle_img.png`,
      "homeUrl": `${APP_URL}`,
      "imageUrl": `${APP_URL}/images/monazzle_feed.png`,
      "screenshotUrls": [],
      "tags": ["monad", "farcaster", "miniapp", "games"],
      "primaryCategory": "games",
      "buttonTitle": "Launch Monazzle",
      //"splashImageUrl": `${APP_URL}/images/monazzle_splash.png`,
      "splashBackgroundColor": "#200D44",
      "webhookUrl": `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
