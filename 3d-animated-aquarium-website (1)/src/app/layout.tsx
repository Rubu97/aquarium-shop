import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || process.env.URL || "http://localhost:3000"),
  title: "EXOTIC AQUARIUM HOUSE | A little ocean. A lot of wonder.",
  description: "Extraordinary fish, beautiful aquariums, aquatic plants and essentials. Build or upgrade your aquarium with EXOTIC AQUARIUM HOUSE, Sualkuchi Kanchan nagar, Kamrup, Assam 781103. Call 8822340240.",
  openGraph: { title: "EXOTIC AQUARIUM HOUSE", description: "Bring a little nature home. Shop fish, tanks, plants and accessories, or design your own aquarium.", images: [{ url: "/images/aquarium-hero.jpg", width: 1568, height: 882, alt: "Exotic Aquarium House planted freshwater aquarium" }] },
  keywords: ["aquarium shop Assam", "fish Sualkuchi", "Exotic Aquarium House", "aquatic plants", "custom aquariums", "fish tanks"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
