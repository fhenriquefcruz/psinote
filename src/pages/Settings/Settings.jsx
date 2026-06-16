import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import { User, Phone, Mail, Key, Shield, Save } from 'lucide-react';
import Tooltip from '../../components/common/Tooltip/Tooltip';

export default function Settings() {
  const { user, userProfile, updateUserProfile, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    phone: userProfile?.phone || '',
    email: userProfile?.email || user?.email || '',
    crp: userProfile?.crp || '',
    crpUf: userProfile?.crpUf || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateUserProfile({
        name: formData.name,
        phone: formData.phone,
        crp: formData.crp,
        crpUf: formData.crpUf
      });
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('Enviar e-mail para redefinir a senha?')) return;
    try {
      await resetPassword(user.email);
      toast.success('E-mail de recuperação enviado!');
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>⚙️ Configurações</h1>
        <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>Gerencie seu perfil e preferências</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {/* Dados Pessoais */}
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={16} /> Dados Pessoais
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Nome completo</label>
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Seu nome" required style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                <Phone size={14} style={{ display: 'inline', marginRight: '0.2rem' }} /> Telefone
              </label>
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                <Mail size={14} style={{ display: 'inline', marginRight: '0.2rem' }} /> E-mail
              </label>
              <input value={formData.email} disabled style={{ ...inputStyle, background: 'var(--bg-tertiary)', cursor: 'not-allowed' }} />
            </div>
          </div>
        </div>

        {/* CRP */}
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={16} /> Identificação Profissional
            <Tooltip text="Número de registro no Conselho Regional de Psicologia. Obrigatório para documentos e relatórios." position="right" />
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>Número do CRP</label>
              <input name="crp" value={formData.crp} onChange={handleChange} placeholder="Ex: 14/12345" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>UF</label>
              <select name="crpUf" value={formData.crpUf} onChange={handleChange} style={inputStyle}>
                <option value="">Selecione</option>
                {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div style={{ background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Key size={16} /> Segurança
          </h3>
          <button type="button" onClick={handleResetPassword} style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '0.875rem', transition: 'var(--transition)' }}>
            🔑 Redefinir senha
          </button>
        </div>

        <button type="submit" disabled={loading} style={{ padding: '0.7rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '1rem', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  fontSize: '0.875rem',
  transition: 'var(--transition)'
};
