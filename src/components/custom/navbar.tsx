"use client"

import { Show, UserButton } from "@clerk/nextjs"
import {Button} from "@/components/ui/button"
import { useRouter } from "next/navigation"

export const Navbar = () => {
    const router = useRouter();
    return (
          <header className="flex justify-end items-center p-4 gap-4 h-16">
            <Show when="signed-out">
              <Button onClick={() => router.push("/login")} className="bg-[#6366F1] hover:bg-[#4F46E5]/80 transition-colors duration-300 cursor-pointer">
                Sign In
              </Button>
              <Button onClick={() => router.push("/sign-up")} className="bg-[#6366F1] hover:bg-[#4F46E5]/80 transition-colors duration-300 cursor-pointer">
                Sign Up
              </Button>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
    )
}