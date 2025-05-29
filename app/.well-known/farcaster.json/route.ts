import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    "accountAssociation": {
    "header": "eyJmaWQiOjEwNjE4OTgsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHgwQmYwOTBmN2ZBOWI2NTQyOTlBZGMzODA1Y2I5ODVlOTQ3QjNlNWM3In0",
    "payload": "eyJkb21haW4iOiJtb25henpsZS52ZXJjZWwuYXBwIn0",
    "signature": "MHg0MmI4NzExMjdkMDE2MmRiZDRmNTE5YmJjMmY3NDczNDFkOTRjNDFmMzU5NDNiZjUzMzQyMWRhZmI0ZjdhYjhhMzQ0OTY1Mzk0ZDM3ZjlhN2JiMDdhZTYwNjA2ZTk2ZWEzYjM2ZmRkNzA2MDdmMzNhZWIzZGFlMTFjNjZmZjU5NzFi"
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
      "splashImageUrl": `${APP_URL}/images/monazzle_splash.png`,
      "splashBackgroundColor": "#200D44",
      "webhookUrl": `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
