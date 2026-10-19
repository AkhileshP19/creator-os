import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import AppProviders from "@/providers/app-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://creator-os-hq.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),

  title: {
    default: "CreatorOS — AI-Powered Content Management & Automation",
    template: "%s | CreatorOS",
  },

  description:
    "CreatorOS is an AI-powered content management and automation platform for short-form creators — manage ideas, generate content, review, approve, schedule, and publish from one workflow.",

  applicationName: "CreatorOS",

  keywords: [
    "CreatorOS",
    "content management platform",
    "content automation",
    "AI content creation",
    "short-form video automation",
    "creator tools",
    "content workflow",
    "AI video generation",
    "content scheduling",
    "YouTube automation",
    "short-form content",
    "creator platform",
  ],

  authors: [
    {
      name: "Akhilesh Patil",
      url: "https://github.com/AkhileshP19",
    },
  ],

  creator: "Akhilesh Patil",
  publisher: "CreatorOS",

  category: "technology",

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: [
      {
        url: "/creatoros_logo.png",
        type: "image/png",
      },
    ],
    shortcut: "/creatoros_logo.png",
    apple: [
      {
        url: "/creatoros_logo.png",
        type: "image/png",
      },
    ],
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "CreatorOS",

    title: "CreatorOS — AI-Powered Content Management & Automation",

    description:
      "Manage the complete short-form content lifecycle — ideas, AI-assisted creation, review, approval, scheduling, publishing, and automation — from one platform.",

    images: [
      {
        url: "/creatoros_logo.png",
        width: 1254,
        height: 1254,
        alt: "CreatorOS",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "CreatorOS — AI-Powered Content Management & Automation",

    description:
      "Manage ideas, AI-assisted creation, approvals, scheduling, publishing, and automation from one creator workflow.",

    images: ["/creatoros_logo.png"],
  },

  robots: {
    index: true,
    follow: true,

    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  referrer: "origin-when-cross-origin",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#4F46E5",
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