 "use client";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type P={id:string;content:string;kind:string;media_url:string|null;created_at:string;author:any};
export default function HomeClient({user,initialPosts}:{user:any;initialPosts:P[]}){
  const [posts,setPosts]=useState(initialPosts); const [tab,setTab]=useState("Inicio"); const [text,setText]=useState(""); const [kind,setKind]=useState("post"); const [profile,setProfile]=useState<any>(null);
  const [messages,setMessages]=useState<any[]>([]); const [selected,setSelected]=useState<any>(null); const [msg,setMsg]=useState(""); const [uploading,setUploading]=useState(false);
  const supabase=createClient();
  const visible=useMemo(()=>tab==="Inicio"?posts:posts.filter(p=>p.kind===tab.toLowerCase().replace("vídeos","video").replace("clips","clip").replace("posts","post")), [posts,tab]);

  useEffect(()=>{ if(!user)return; supabase.from("profiles").select("*").eq("id",user.id).single().then(({data})=>setProfile(data)); },[user]);

  async function publish(){ if(!text.trim()||!user)return; const {data,error}=await supabase.from("posts").insert({author_id:user.id,content:text,kind}).select("id,content,kind,media_url,created_at,author:profiles!posts_author_id_fkey(id,username,display_name,avatar_url,verified)").single(); if(!error&&data){setPosts([data,...posts]);setText("");} }
  async function like(id:string){ if(!user)return; await supabase.from("likes").upsert({user_id:user.id,post_id:id}); }
  async function logout(){await supabase.auth.signOut(); location.href="/auth";}
  async function loadMessages(){ if(!user)return; const {data}=await supabase.from("conversations").select("id,title,conversation_members!inner(user_id),messages(id,body,sender_id,created_at)").order("created_at",{foreignTable:"messages",ascending:true}); setMessages(data||[]); setTab("Mensajes"); }
  async function sendMessage(){ if(!user||!selected||!msg.trim())return; await supabase.from("messages").insert({conversation_id:selected.id,sender_id:user.id,body:msg}); setMsg(""); loadMessages(); }

  if(!user) return <main className="landing"><div className="hero"><div className="logo">🦖 DinoRamtix 2</div><h1>Tu mundo. Tus videos. Tu comunidad.</h1><p>Clips, videos, posts, historias y mensajes en una sola red.</p><a className="button" href="/auth">Entrar / Crear cuenta</a></div></main>;

  return <main className="shell">
    <header><div className="logo">🦖 DinoRamtix 2</div><nav>{["Inicio","Clips","Vídeos","Posts"].map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)} key={x}>{x}</button>)}<button onClick={loadMessages}>Mensajes</button><button onClick={()=>setTab("Perfil")}>Mi perfil</button></nav><button className="ghost" onClick={logout}>Salir</button></header>
    {tab==="Perfil" ? <Profile profile={profile} user={user} posts={posts.filter(p=>p.author?.id===user.id)} /> :
    tab==="Mensajes" ? <section className="grid"><div className="card"><h2>Mensajes</h2>{messages.map(c=><button className="list" key={c.id} onClick={()=>setSelected(c)}>{c.title||"Conversación"}</button>)}</div><div className="card"><h2>{selected?.title||"Selecciona una conversación"}</h2>{selected?.messages?.map((m:any)=><p className={m.sender_id===user.id?"mine":"bubble"} key={m.id}>{m.body}</p>)}{selected&&<div className="composer"><input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Escribe..."/><button onClick={sendMessage}>Enviar</button></div>}</div></section> :
    <><section className="composer card"><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="¿Qué está pasando en DinoRamtix?"/><div><select value={kind} onChange={e=>setKind(e.target.value)}><option value="post">Post</option><option value="clip">Clip</option><option value="video">Vídeo</option></select><button onClick={publish}>Publicar</button></div></section>
    <section className="feed">{visible.map(p=><article className="card" key={p.id}><div className="author"><b>@{p.author?.username||"usuario"}</b>{p.author?.verified&&<span>✓</span>}<small>{new Date(p.created_at).toLocaleString()}</small></div><p>{p.content}</p>{p.media_url&&<video controls playsInline src={p.media_url}/>}<div className="actions"><button onClick={()=>like(p.id)}>♥ Me gusta</button><button>💬 Comentar</button><button>↗ Compartir</button></div></article>)}</section></>}
  </main>
}
function Profile({profile,posts,user}:{profile:any;posts:any[];user:any}){return <section className="profile card"><div className="avatar">{profile?.display_name?.[0]||"D"}</div><h1>{profile?.display_name||"Tu perfil"}</h1><p>@{profile?.username||"usuario"} {profile?.verified&&"✓"}</p><p>{profile?.bio||"Bienvenido a mi DinoSpace."}</p><div className="stats"><span><b>{posts.length}</b> publicaciones</span><span><b>{profile?.followers_count||0}</b> seguidores</span><span><b>{profile?.following_count||0}</b> siguiendo</span></div><div className="profile-grid">{posts.map(p=><div className="tile" key={p.id}>{p.content}</div>)}</div></section>}
