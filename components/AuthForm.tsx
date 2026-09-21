 "use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
export default function AuthForm(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [name,setName]=useState("");
  const [signup,setSignup]=useState(false); const [msg,setMsg]=useState("");
  async function submit(e:React.FormEvent){
    e.preventDefault(); setMsg(""); const s=createClient();
    if(signup){
      const {error}=await s.auth.signUp({email,password,options:{data:{display_name:name,username:name.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,20)}}});
      setMsg(error?.message || "Revisa tu correo para confirmar tu cuenta.");
    } else {
      const {error}=await s.auth.signInWithPassword({email,password});
      if(error) setMsg(error.message); else location.href="/";
    }
  }
  return <form onSubmit={submit} className="form">
    {signup && <input placeholder="Nombre visible" value={name} onChange={e=>setName(e.target.value)} required/>}
    <input type="email" placeholder="Correo" value={email} onChange={e=>setEmail(e.target.value)} required/>
    <input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required/>
    <button>{signup?"Crear cuenta":"Entrar"}</button>
    <button type="button" className="ghost" onClick={()=>setSignup(!signup)}>{signup?"Ya tengo cuenta":"Crear cuenta"}</button>
    {msg && <p className="muted">{msg}</p>}
  </form>
}
