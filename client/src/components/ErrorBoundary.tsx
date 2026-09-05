import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function isChunkLoadingError(error: Error | null) {
  return Boolean(error?.message && /chunk|dynamically imported module|failed to fetch/i.test(error.message));
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      const chunkError = isChunkLoadingError(this.state.error);
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#F7F2E9] p-6 text-[#183A32]">
          <section className="w-full max-w-xl border border-[#183A32]/15 bg-white p-8 text-center shadow-sm sm:p-10" role="alert">
            <AlertTriangle size={44} className="mx-auto mb-5 text-[#C85A3F]" aria-hidden="true" />
            <p className="font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-[#C85A3F]">Pátio Zambeze</p>
            <h1 className="mt-3 font-display text-3xl leading-tight">Não foi possível carregar esta página.</h1>
            <p className="mt-4 font-sans text-sm leading-relaxed text-[#183A32]/70">
              {chunkError
                ? "A versão da aplicação foi actualizada. Recarregue a página para obter os ficheiros mais recentes."
                : "Ocorreu um erro inesperado ao iniciar o menu. Recarregue a página e tente novamente."}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 bg-[#183A32] px-5 py-3 font-sans text-xs font-bold uppercase tracking-[0.14em] text-[#F7F2E9]"
            >
              <RotateCcw size={16} aria-hidden="true" />
              Recarregar página
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
