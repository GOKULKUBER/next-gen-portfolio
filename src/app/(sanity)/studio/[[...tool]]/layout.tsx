import type { Metadata } from "next";

export const metadate: Metadata = {
  title: "NextGen Portfolio Studio",
  description: "NextGen Portfolio Studio",
};
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export default Layout;
