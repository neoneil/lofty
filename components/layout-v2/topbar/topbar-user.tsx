"use client";

import type { User } from "@supabase/supabase-js";

import { ProfileMenu } from "@/components/profile/profile-menu";

type Props = {
  user: User | null;
};

export function TopbarUser({
  user,
}: Props) {

  return (

    <ProfileMenu user={user} />
  );
}
