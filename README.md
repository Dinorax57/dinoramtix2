# DinoRamtix 2 — v0.2 full-stack

Esta versión reemplaza el prototipo local por una base real con Next.js + Supabase + Cloudflare Stream.

## Ya preparado
- Registro/login real con Supabase Auth.
- Perfil propio y estructura de perfiles públicos.
- Feed real desde PostgreSQL.
- Posts, clips y vídeos como tipos de contenido.
- Likes, comentarios, follows y stories en el esquema.
- Mensajería/conversaciones en PostgreSQL y preparada para Realtime.
- Endpoint seguro para crear URLs de subida de Cloudflare Stream.
- RLS para separar datos públicos y privados.
- Diseño responsive futurista.

## Lo que debes configurar (no compartas secretos conmigo)
1. Crea un proyecto Supabase.
2. En Supabase > SQL Editor pega `supabase/schema.sql` y ejecútalo.
3. En Supabase Auth configura la URL del sitio y el email de confirmación. Para el flujo SSR, el template puede apuntar a `/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
4. Crea una cuenta Cloudflare y activa Stream. Crea un API Token con permiso Stream Write.
5. Copia `.env.example` a `.env.local` y rellena:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   - CLOUDFLARE_ACCOUNT_ID
   - CLOUDFLARE_STREAM_TOKEN
   - NEXT_PUBLIC_SITE_URL
6. Ejecuta:
   npm install
   npm run dev
7. Para producción, sube este proyecto a GitHub y conéctalo a Vercel. Añade las mismas variables de entorno en Production y despliega.
8. En Supabase Auth > URL Configuration añade tu dominio público como Site URL y Redirect URL.

## Importante sobre vídeos
El endpoint `/api/stream/direct-upload` crea una URL de un solo uso sin exponer el token de Cloudflare al navegador. Cloudflare recomienda Direct Creator Uploads para que los usuarios suban directamente a Stream; para archivos de más de 200 MB se usa TUS/resumable.

## Antes de abrirlo al público
Faltan capas de lanzamiento que conviene activar antes de una audiencia grande:
- Moderación y panel de administración.
- Bloqueos, silenciamiento y controles de privacidad.
- Recuperación de cuenta y configuración completa de email.
- Rate limiting/anti-spam/anti-bot.
- Subida de imágenes a Storage con validación.
- Flujo completo de comentarios, follows, stories, notificaciones y chat UI.
- Página de verificación y revisión manual a partir de 10.000 seguidores.
- Términos, privacidad, reportes y eliminación de contenido.
- Analytics y backups según el plan elegido.

No uses secretos de Cloudflare en el frontend ni los subas a GitHub.
