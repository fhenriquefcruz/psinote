import React from 'react';
import { reportTechnicalError, routeKeyFromPath } from '../../../services/diagnosticsService';
import styles from './AppErrorBoundary.module.css';

/** @extends {React.Component<{children: React.ReactNode}, {hasError: boolean, eventId: string | null}>} */
export default class AppErrorBoundary extends React.Component {
  /** @type {{hasError: boolean, eventId: string | null}} */
  state = { hasError: false, eventId: null };

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

  handleReload = () => window.location.reload();

  handleHome = () => {
    const base = import.meta.env.BASE_URL || '/psinote/';
    window.location.assign(base.replace(/\/?$/, '/') + 'dashboard');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className={styles.page}>
        <section className={styles.card} role="alert" aria-labelledby="recovery-title">
          <div className="section-kicker">Falha inesperada</div>
          <h1 id="recovery-title">Não foi possível exibir esta tela.</h1>
          <p>
            O PsiNote identificou uma falha técnica. A referência exibida não contém
            nomes de pacientes nem anotações clínicas.
          </p>
          {this.state.eventId && (
            <p className={styles.reference}>
              Referência técnica: <code>{this.state.eventId}</code>
            </p>
          )}
          <p className={styles.note}>
            Se houver alterações ainda não salvas, recarregar a página pode descartá-las.
          </p>
          <div className={styles.actions}>
            <button type="button" className="button button-primary" onClick={this.handleReload}>
              Recarregar
            </button>
            <button type="button" className="button button-secondary" onClick={this.handleHome}>
              Ir para o painel
            </button>
          </div>
        </section>
      </main>
    );
  }
}
