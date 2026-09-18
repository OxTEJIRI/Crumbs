import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WalletContextProvider from "@/components/wallet/WalletContextProvider";
import { TransactionToastProvider } from "@/components/tx/TransactionToasts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Crumbs",
  description:
    "Bake. Hoard. Raid. An on-chain idle-strategy game on Cookie Chain.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <WalletContextProvider>
          <TransactionToastProvider>{children}</TransactionToastProvider>
        </WalletContextProvider>
      </body>
    </html>
  );
}
