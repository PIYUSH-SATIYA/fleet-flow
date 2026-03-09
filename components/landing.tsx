"use client";

import Link from "next/link";
import {
  Truck,
  MapPin,
  Users,
  Wrench,
  Receipt,
  BarChart3,
  ArrowRight,
  Zap,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Truck,
    title: "Fleet & Vehicles",
    description: "Track every vehicle, status, and assignment in one place.",
  },
  {
    icon: MapPin,
    title: "Trips & Dispatch",
    description: "Plan routes, assign drivers, and monitor cargo in real time.",
  },
  {
    icon: Users,
    title: "Drivers",
    description: "Manage availability, licenses, and driver assignments.",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    description: "Schedule service, track alerts, and keep vehicles on the road.",
  },
  {
    icon: Receipt,
    title: "Expenses",
    description: "Log fuel, repairs, and costs with clear reporting.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "KPIs, utilization, and insights at a glance.",
  },
];

const highlights = [
  { icon: LayoutDashboard, text: "Command center dashboard" },
  { icon: Zap, text: "Real-time status & alerts" },
  { icon: Shield, text: "Secure auth & organizations" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-sm bg-background/80">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">FleetFlow</span>
          </div>
          <nav className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-primary font-medium text-sm uppercase tracking-widest mb-4">
            Fleet & logistics management
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance leading-[1.1]">
            Run your fleet without the chaos
          </h1>
          <p className="mt-6 text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
            One place for vehicles, trips, drivers, maintenance, and expenses.
            Get a live command center and clear analytics—so you can focus on
            moving, not mess.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 text-base px-8" asChild>
              <Link href="/sign-up">
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {highlights.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary/80" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Everything you need to run the fleet
            </h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              From vehicles and trips to maintenance and expenses—all in one
              modular system.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-xl border border-border bg-background/80 p-6 hover:border-primary/30 hover:bg-primary/5 transition-colors duration-200"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-10 md:p-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Ready to streamline your fleet?
          </h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Sign up in seconds. No credit card required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link href="/sign-up">
                Create account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">FleetFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
