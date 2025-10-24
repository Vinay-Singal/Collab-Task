import "./globals.css";
import "../../styles/globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Collab Tasks",
  description: "Fullstack CRUD App with Next.js 15 + MongoDB",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black dark:bg-black dark:text-white">
        <header className="p-4 bg-blue-600 text-white font-bold">
          Collab Tasks
        </header>
        <main className="p-4">{children}</main>
        <footer className="p-4 text-center text-sm text-gray-500">
          Developed by Vinay Singal |{" "}
          <a href="https://github.com/vinay-singal/Collab-Tasks/" target="_blank">GitHub</a> |{" "}
          <a href="https://linkedin.com/in/singalvinay/"target="_blank">LinkedIn</a>
        </footer>
      </body>
    </html>
  );
}
