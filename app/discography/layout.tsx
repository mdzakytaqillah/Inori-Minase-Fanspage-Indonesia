import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Info Diskografi",
};

export default function DiscographyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
