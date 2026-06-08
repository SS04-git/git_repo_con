import { JetBrains_Mono } from "next/font/google";

const font = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata = {
  title: "GitHub Commit Viewer",
  description: "Monitor commits and contributors across any public GitHub repository",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className} style={{ margin: 0, background: "#121212" }}>
        {children}
      </body>
    </html>
  );
}