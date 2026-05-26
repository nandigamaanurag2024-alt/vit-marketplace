import "./globals.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-800">
          <Link
            href="/"
            className="text-2xl font-bold"
          >
            VIT Marketplace
          </Link>

          <div className="flex gap-6">
            <Link href="/marketplace">
              Buy
            </Link>

            <Link href="/sell">
              Sell
            </Link>

            <Link href="/login">
              Login
            </Link>

            <Link href="/signup">
              Signup
            </Link>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}