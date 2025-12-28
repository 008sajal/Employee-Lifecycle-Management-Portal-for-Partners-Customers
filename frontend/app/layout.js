import "./globals.css";

export const metadata = {
  title: "Belzir Portal",
  description: "Employee Lifecycle Management Portal"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">{children}</body>
    </html>
  );
}
