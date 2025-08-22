import "./globals.css";
import Link from 'next/link';


export const metadata = {
  title: "MedicMate",
  description: "Personal drug reaction & medication schedule tracker",
};

export default function RootLayout({ children }) {
  return (
      <html lang="en">
      <body>
      {/* animated gradient background */}
      <div className="bg">
        <div className="bg__layer" />
        <div className="bg__pattern" />
      </div>

      {/* app shell */}
      <header className="shell">
        <div className="brand">
          <span className="logo">💊</span>
          <span className="brand__name">MedicMate</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav__link">Reaction Logger</Link>
          <Link href="/meds" className="nav__link">Medication Schedule</Link>
        </nav>
      </header>

      <main className="shell">{children}</main>

      <footer className="shell footer">
        <div>© 2025 All rights reserved. A Mubasshir Al Shahriar Product. </div>
      </footer>
      </body>
      </html>
  );
}
