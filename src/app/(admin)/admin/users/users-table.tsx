"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { relativeDate } from "@/lib/utils";
import type { Profile } from "@/types/database";
import type { UserRole } from "@/types/database";

interface UsersTableProps {
  profiles: Profile[];
  currentUserId: string | null;
}

export function UsersTable({ profiles, currentUserId }: UsersTableProps) {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profilesState, setProfilesState] = useState(profiles);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  async function handleRoleChange(profileId: string, newRole: UserRole) {
    setError(null);
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update role");
      setProfilesState((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, role: newRole } : p))
      );
      setSelectedProfile((prev) =>
        prev?.id === profileId ? { ...prev, role: newRole } : prev
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setIsUpdating(false);
    }
  }

  const canChangeRole = (profileId: string) =>
    currentUserId !== null && profileId !== currentUserId;

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Onboarded</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profilesState.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No users yet
                </TableCell>
              </TableRow>
            ) : (
              profilesState.map((profile) => (
                <TableRow
                  key={profile.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <TableCell className="font-medium">
                    {profile.full_name ?? "—"}
                  </TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {profile.company_name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={profile.role === "admin" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {profile.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {profile.onboarding_completed ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Yes
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        No
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(profile.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedProfile}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedProfile(null);
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProfile?.full_name ?? "User Details"}
            </DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Email</span>
                <p>{selectedProfile.email}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Full Name</span>
                <p>{selectedProfile.full_name ?? "—"}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Company</span>
                <p>{selectedProfile.company_name ?? "—"}</p>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <div>
                <span className="font-medium text-muted-foreground">Role</span>
                {canChangeRole(selectedProfile.id) ? (
                  <Select
                    value={selectedProfile.role}
                    onValueChange={(value) =>
                      handleRoleChange(selectedProfile.id, value as UserRole)
                    }
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="mt-1.5 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder">Founder</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="capitalize mt-1.5">
                    {selectedProfile.role}
                    {selectedProfile.id === currentUserId && (
                      <span className="text-muted-foreground text-xs ml-1">
                        (you)
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Onboarding</span>
                <p>
                  {selectedProfile.onboarding_completed ? "Completed" : "Pending"}
                </p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Joined</span>
                <p>
                  {formatDate(selectedProfile.created_at)} (
                  {relativeDate(selectedProfile.created_at)})
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
