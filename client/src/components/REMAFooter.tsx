const REMA_LOGO_URL = "/manus-storage/rema-logo-horizontal-transparent_cc992c4c.png";

export default function REMAFooter() {
  return (
    <footer className="rema-footer" aria-label="Assinatura tecnológica">
      <img
        src={REMA_LOGO_URL}
        alt="REMA"
        className="rema-footer-logo"
        width={72}
        height={48}
      />
      <p>Desenvolvido por REMA | Sistema de Gestão de Menu Digital</p>
    </footer>
  );
}
