import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "DinoRamtix 2",
  description: "La red social de clips, videos, posts, historias y mensajes."
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="es"><body>{children}</body></html>;
}
