import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "@/components/custom/navbar";
import AppProviders from "@/providers/app-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Creator OS",
  description:
    "AI-powered content management and automation platform for short-form video creators.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#6366F1",
            },
          }}
        >
          <AppProviders>
            <Navbar />
            {children}
          </AppProviders>
        </ClerkProvider>
      </body>
    </html>
  );
}
