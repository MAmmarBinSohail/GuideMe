const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callAdminAction(action: string, userId: string, value?: unknown) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-actions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ action, userId, value }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Action failed");
  return data;
}

export const adminService = {
  blockUser: (userId: string) => callAdminAction("block", userId, true),
  unblockUser: (userId: string) => callAdminAction("block", userId, false),
  verifyMentor: (userId: string) => callAdminAction("verify", userId, true),
  unverifyMentor: (userId: string) => callAdminAction("verify", userId, false),
  changeRole: (userId: string, role: string) => callAdminAction("change_role", userId, role),
  deleteVideo: (videoId: string) => callAdminAction("delete_video", videoId),
};
