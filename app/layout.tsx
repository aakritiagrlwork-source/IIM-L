import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taskflow | Personal Task Manager",
  description: "A simple workspace to organise tasks, timelines and progress."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
