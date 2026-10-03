import React from 'react';
import {
  reportTechnicalError,
  routeKeyFromPath
} from '../../../services/diagnosticsService';
import styles from './AppErrorBoundary.module.css';

export default class AppErrorBoundary extends React.Component {
  state = {
    hasError: false,
    eventId: null
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    const eventId = reportTechnicalError(error, {
      category: 'ui_crash',
      operation: 'react.render',
      routeKey: routeKeyFromPath(window.location.pathname)
    });

    this.setState({ eventId });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.assign(
      (import.meta.env.BASE_URL || '/') + 'dashboard'
    );
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className={styles.page}>
        <section className={styles.card} role="alert">
          <div className="section-kicker">Falha inesperada</div>
          <h1>Não foi possível concluir esta tela.</h1>
          <p>
            Nenhum conteúdo clínico é incluído no diagnóstico técnico.
            Você pode recarregar a aplicação ou voltar ao início.
          </p>

          {this.state.eventId && (
            <p className={styles.reference}>
              Referência técnica: <code>{this.state.eventId}</code>
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              className="button button-primary"
              onClick={this.handleReload}
            >
              Recarregar
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={this.handleHome}
            >
              Voltar ao início
            </button>
          </div>
        </section>
      </main>
    );
  }
}
