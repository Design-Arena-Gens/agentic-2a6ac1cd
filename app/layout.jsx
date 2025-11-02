export const metadata = {
  title: "McDonald's AI Agent",
  description: "Ask questions, explore the menu, and build an order.",
};

import "../styles/globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-amber-50 text-neutral-900">
          <header className="border-b border-amber-200 bg-white/80 backdrop-blur sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-400" />
                <h1 className="font-extrabold text-lg">McDonald's AI Agent</h1>
              </div>
              <span className="text-xs text-neutral-500">Unofficial demo</span>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
          <footer className="border-t border-amber-200 bg-white/60 mt-8">
            <div className="max-w-4xl mx-auto px-4 py-6 text-xs text-neutral-500">
              Menu data is illustrative; not affiliated with McDonald's.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
