
import "./globals.css";

// Prompt is SELF-HOSTED (files in /public/fonts, served same-origin at
// /appfund/fonts/...) and declared via an inline <style> in <head> below.
// Why not next/font or a Google <link>?
//  - next/font's CSS is injected by Turbopack's dev runtime and was
//    intermittently dropped on HMR recompiles -> font silently fell back.
//  - A Google Fonts <link> depends on the *client* reaching fonts.gstatic.com,
//    which isn't guaranteed on every network.
// A server-rendered inline @font-face pointing at same-origin files is immune
// to both. The font family "Prompt" is also mapped in globals.css @theme.
const FONT_WEIGHTS = [300, 400, 500, 600, 700];
const UR_LATIN = "U+0000-00FF,U+0131,U+2013-2014,U+2018-2019,U+201C-201D,U+2026,U+20AB";
const UR_THAI = "U+0E01-0E5B,U+200C-200D,U+25CC";
const FONT_CSS =
  FONT_WEIGHTS.map((w) =>
    `@font-face{font-family:'Prompt';font-style:normal;font-weight:${w};font-display:swap;src:url('/appfund/fonts/prompt-${w}-latin.woff2') format('woff2');unicode-range:${UR_LATIN};}` +
    `@font-face{font-family:'Prompt';font-style:normal;font-weight:${w};font-display:swap;src:url('/appfund/fonts/prompt-${w}-thai.woff2') format('woff2');unicode-range:${UR_THAI};}`
  ).join("") +
  "body,button,input,select,textarea{font-family:'Prompt',system-ui,sans-serif;}";

export const metadata = {
  title: "เป๋าเรา Acc BA 34 - Full AI & Original Features (V11)",
  description: "ระบบจัดการเงินรุ่นและทำเนียบศิษย์เก่า",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        {/* Self-hosted Prompt font faces — server-rendered, same-origin, no external deps */}
        <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className="font-sans">
        {/* Animated aurora glassmorphism backdrop */}
        <div className="aurora-bg" aria-hidden="true">
          {/* Subtle photo backdrop (image at public/vault.jpg). Styled inline so it is
              server-rendered and immune to Turbopack's flaky dev CSS injection. */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.45,
              backgroundImage:
                'linear-gradient(160deg, rgba(20,10,44,0.55), rgba(12,6,32,0.68)), url("/appfund/vault.jpg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>
          <div className="aurora-blob aurora-blob-1"></div>
          <div className="aurora-blob aurora-blob-2"></div>
          <div className="aurora-blob aurora-blob-3"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
