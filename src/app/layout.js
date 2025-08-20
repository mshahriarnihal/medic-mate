import "./globals.css";

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
          <a href="/" className="nav__link">Reaction Logger</a>
          <a href="/meds" className="nav__link">Medication Schedule</a>
        </nav>
      </header>

      <main className="shell">{children}</main>

      <footer className="shell footer">
        <div>Built with Next.js, Prisma & PostgreSQL</div>
      </footer>
      </body>
      </html>
  );
}
