"use client";

import { OrganizationProfile, useOrganization } from "@clerk/nextjs";
import { Building2 } from "lucide-react";

// ============================================================
// Settings — Org member management, invitations & roles
// ============================================================
// Uses Clerk's <OrganizationProfile /> which provides:
//   • Members tab   → view / change role / remove members
//   • Invitations   → send invite by email with role, revoke pending
//   • General       → update org name, logo, slug, danger zone
//
// Future: we can add webhook sync (organizationMembership events)
// to keep MongoDB in sync when members join/leave/change role.
// ============================================================

export default function SettingsPage() {
  const { organization, isLoaded } = useOrganization();

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Organization Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage members, send invitations, and configure your organization.
        </p>
      </div>

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="rounded-xl border border-border bg-card p-12 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      )}

      {/* No active org — prompt to create or switch */}
      {isLoaded && !organization && (
        <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              No organization selected
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Create or switch to an organization using the selector in the
              sidebar to manage members and invitations.
            </p>
          </div>
        </div>
      )}

      {/* Active org — render full profile */}
      {isLoaded && organization && (
        <OrganizationProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full max-w-none shadow-none",
              card: "w-full max-w-none bg-card border border-border rounded-xl shadow-none",
              navbar: "bg-card border-r border-border",
              navbarButton:
                "text-muted-foreground hover:text-foreground hover:bg-muted",
              navbarButtonActive: "text-primary bg-primary/10",
              pageScrollBox: "bg-card",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              profileSectionTitle: "text-foreground",
              profileSectionContent: "text-muted-foreground",
              tableHead: "text-muted-foreground",
              userPreviewMainIdentifier: "text-foreground",
              userPreviewSecondaryIdentifier: "text-muted-foreground",
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90",
              formButtonReset: "text-muted-foreground hover:text-foreground",
              badge: "bg-primary/10 text-primary",
              formFieldInput:
                "bg-background border-border text-foreground focus:ring-primary",
              formFieldLabel: "text-foreground",
              membersPageInviteButton:
                "bg-primary text-primary-foreground hover:bg-primary/90",
            },
          }}
        />
      )}
    </div>
  );
}

