import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    // TODO: Add account association
    frame: {
      version: "1",
      name: "Monazzle",
      iconUrl: `${APP_URL}/images/homestarter.png`,
      homeUrl: `${APP_URL}`,
      imageUrl: `${APP_URL}/images/homestarter.png`,
      screenshotUrls: [],
      tags: ["monad", "farcaster", "miniapp", "template"],
      primaryCategory: "developer-tools",
      buttonTitle: "Launch Template",
      splashImageUrl: `${APP_URL}/images/monazzle_jigsaw.gif`,
      splashBackgroundColor: "#200D44",
      webhookUrl: `${APP_URL}/api/webhook`,
    },
  };

  return NextResponse.json(farcasterConfig);
}
