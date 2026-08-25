const REMA_LOGO_URL = "/manus-storage/rema-logo-transparent-clean_a9363c1f.png";

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
