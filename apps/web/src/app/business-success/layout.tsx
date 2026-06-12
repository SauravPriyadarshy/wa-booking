import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Success Demo | WhatsApp Business Assistant",
  description:
    "See how BookNow helps coaching centers, clinics, salons, and home services — interactive demo, no signup required.",
  openGraph: {
    title: "See How This Helps Your Business",
    description: "Interactive industry demo for Indian service businesses.",
    url: "/business-success",
    type: "website",
  },
};

export default function BusinessSuccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
