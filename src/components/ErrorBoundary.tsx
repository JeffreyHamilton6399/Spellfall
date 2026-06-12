"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Spellfall] Render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-6 px-4 text-center">
          <div className="text-4xl font-display font-black text-rose-400 tracking-wide">
            Something went wrong
          </div>
          <p className="text-slate-400 max-w-sm text-sm leading-relaxed">
            {this.state.error.message || "An unexpected error occurred in the game."}
          </p>
          <button
            onClick={() => window.location.assign("/")}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
          >
            Return to lobby
          </button>
          <button
            onClick={() => this.setState({ error: null })}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
