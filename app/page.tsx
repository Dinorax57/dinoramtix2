import { createClient } from "@/lib/supabase/server";
import HomeClient from "@/components/HomeClient";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: posts } = await supabase
    .from("posts")
    .select("id,content,kind,media_url,created_at,author:profiles!posts_author_id_fkey(id,username,display_name,avatar_url,verified)")
    .order("created_at", { ascending:false }).limit(50);
  return <HomeClient user={user ? {id:user.id,email:user.email ?? ""}:null} initialPosts={posts ?? []} />;
}
