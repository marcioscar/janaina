// Logo do app financeiro da Janaina
// Bloco bordô com três barras em alta; a moeda verde acima da maior é a meta sendo atingida.

export function LogoMark({ size = 40, tone = "light", mono, title = "Janaina finanças", ...props }) {
  const tile = mono ?? (tone === "dark" ? "#F3CFCB" : "#561530");
  const bars = mono ? "#fff" : tone === "dark" ? "#561530" : "#F3CFCB";
  const coin = mono ? "#fff" : "#3E6A50";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" role="img" aria-label={title} {...props}>
      <rect width="64" height="64" rx="16" fill={tile} />
      <rect x="13" y="36" width="9" height="15" rx="3" fill={bars} />
      <rect x="27.5" y="28" width="9" height="23" rx="3" fill={bars} />
      <rect x="42" y="20" width="9" height="31" rx="3" fill={bars} />
      <circle cx="46.5" cy="11.5" r="4.5" fill={coin} stroke={tile} strokeWidth="2" />
    </svg>
  );
}

export function Logo({ size = 40, tone = "light", showTagline = true, style, ...props }) {
  const text = tone === "dark" ? "#FAF6F4" : "#561530";
  const sub = tone === "dark" ? "#F3CFCB" : "#3E6A50";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.28, ...style }} {...props}>
      <LogoMark size={size} tone={tone} />
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1, fontFamily: "var(--font-brand, 'Bricolage Grotesque', system-ui, sans-serif)" }}>
        <span style={{ fontSize: size * 0.62, fontWeight: 700, letterSpacing: "-0.03em", color: text }}>janaina</span>
        {showTagline && (
          <span style={{ fontSize: size * 0.28, fontWeight: 400, color: sub, marginTop: size * 0.06 }}>finanças</span>
        )}
      </span>
    </span>
  );
}

export default Logo;
