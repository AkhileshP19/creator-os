"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Brand, StartLink } from "./shared";

const navigation = [["Product", "product"], ["Workflow", "workflow"], ["Demo", "demo"], ["Technology", "technology"]] as const;

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  return <header className="landing-header"><div className="landing-container landing-nav-row">
    <Brand />
    <nav aria-label="Main navigation" className="landing-desktop-nav">{navigation.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}</nav>
    <div className="landing-account"><Link href="/login" className="landing-login">Log in</Link><StartLink /></div>
    <div className="landing-mobile-toggle"><Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="size-11" aria-label="Open navigation" />}><Menu aria-hidden="true" /></DialogTrigger>
      <DialogContent className="motion-reduce:animate-none [&_[data-slot=dialog-close]]:size-11">
        <DialogTitle>Explore CreatorOS</DialogTitle><DialogDescription>From your first idea to your next published video.</DialogDescription>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-1">{navigation.map(([label, id]) => <a className="rounded-lg px-3 py-3 font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary" key={id} href={`#${id}`} onClick={() => setOpen(false)}>{label}</a>)}<Link href="/login" className="rounded-lg px-3 py-3" onClick={() => setOpen(false)}>Log in</Link><Link href="/sign-up" className="rounded-lg bg-primary px-3 py-3 text-center font-medium text-primary-foreground" onClick={() => setOpen(false)}>Start creating</Link></nav>
      </DialogContent>
    </Dialog></div>
  </div></header>;
}
