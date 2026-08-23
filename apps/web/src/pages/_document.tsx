import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link href="/favicon.ico" rel="icon" sizes="48x48" />
        <link href="/logo.png" rel="icon" sizes="512x512" type="image/png" />
        <link href="/logo.png" rel="apple-touch-icon" />
        <link href="/site.webmanifest" rel="manifest" />
        <meta content="#f5f3ff" name="theme-color" />

        <link href="https://fonts.googleapis.com" rel="preconnect" />
        {/* Font files are fetched with CORS, so this preconnect only saves the
            handshake when it carries the crossorigin attribute. */}
        <link
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com"
          rel="preconnect"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,300..900;1,300..900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
