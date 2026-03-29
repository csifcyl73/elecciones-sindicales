"use client";
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, UserPlus, RefreshCw, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2, Copy, Check,
} from 'lucide-react';

const COMUNIDADES = [
  'ANDALUCÍA',
  'ARAGÓN',
  'ASTURIAS (PRINCIPADO DE)',
  'BALEARES (ISLAS)',
  'CANARIAS',
  'CANTABRIA',
  'CASTILLA-LA MANCHA',
  'CASTILLA Y LEÓN',
  'CATALUÑA',
  'COMUNIDAD VALENCIANA',
  'EXTREMADURA',
  'GALICIA',
  'LA RIOJA',
  'MADRID (COMUNIDAD DE)',
  'MURCIA (REGIÓN DE)',
  'NAVARRA (COMUNIDAD FORAL DE)',
  'PAÍS VASCO',
  'CEUTA (CIUDAD AUTÓNOMA DE)',
  'MELILLA (CIUDAD AUTÓNOMA DE)',
];

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%&*+-';
  const all = upper + lower + digits + special;

  const rand = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  // Garantizar al menos uno de cada tipo
  const required = [rand(upper), rand(upper), rand(lower), rand(lower), rand(digits), rand(special)];
  const extra = Array.from({ length: 6 }, () => rand(all));
  const combined = [...required, ...extra];

  // Mezclar aleatoriamente
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join('');
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: 'Mín. 8 caracteres', ok: password.length >= 8 },
    { label: 'Mayúscula', ok: /[A-Z]/.test(password) },
    { label: 'Minúscula', ok: /[a-z]/.test(password) },
    { label: 'Número', ok: /\d/.test(password) },
    { label: 'Símbolo', ok: /[!@#$%&*+\-]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const color = score <= 2 ? 'bg-red-500' : score <= 3 ? 'bg-amber-500' : score === 4 ? 'bg-yellow-400' : 'bg-emerald-500';
  const label = score <= 2 ? 'Débil' : score <= 3 ? 'Media' : score === 4 ? 'Buena' : 'Fuerte';

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${(score / 5) * 100}%` }} />
        </div>
        <span className={`text-xs font-semibold ${color.replace('bg-', 'text-')}`}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {checks.map(c => (
          <span key={c.label} className={`text-xs px-2 py-0.5 rounded-full border ${c.ok ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-white/30'}`}>
            {c.ok ? '✓' : '·'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AltaAdministradorAutonomico() {
  const router = useRouter();

  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    comunidad: '',
    usuario: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleUppercase = (field: 'nombre' | 'apellidos') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value.toUpperCase() }));
  };

  const handleGenerate = useCallback(() => {
    const pwd = generateSecurePassword();
    setForm(f => ({ ...f, password: pwd }));
    setShowPassword(true);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(form.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [form.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/crear-autonomico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', msg: `✅ Administrador autonómico "${form.nombre} ${form.apellidos}" dado de alta correctamente.` });
        setForm({ nombre: '', apellidos: '', comunidad: '', usuario: '', password: '' });
      } else {
        setStatus({ type: 'error', msg: data.error || 'Error al crear el usuario.' });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Error de conexión. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white relative overflow-hidden">
      {/* Fondos decorativos */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-900/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-sm">CS</span>
          </div>
          <div>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">CSIF · Elecciones Sindicales</p>
            <h1 className="text-lg font-bold text-white leading-tight">Administrador Nacional</h1>
          </div>
        </div>
        <button
          onClick={() => router.push('/admin/nacional/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </header>

      {/* Contenido */}
      <main className="relative z-10 px-6 md:px-12 py-10 max-w-2xl mx-auto">
        {/* Título */}
        <div className="mb-8">
          <p className="text-emerald-400 font-semibold mb-1 tracking-wide uppercase text-sm">Gestión de usuarios</p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <UserPlus className="w-9 h-9 text-emerald-400" />
            Alta Administrador Autonómico
          </h2>
          <p className="mt-2 text-white/50">Rellena el formulario para crear un nuevo administrador de comunidad autónoma.</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8">

          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={handleUppercase('nombre')}
              placeholder="NOMBRE..."
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium tracking-wide"
            />
          </div>

          {/* Apellidos */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">Apellidos</label>
            <input
              type="text"
              value={form.apellidos}
              onChange={handleUppercase('apellidos')}
              placeholder="APELLIDOS..."
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium tracking-wide"
            />
          </div>

          {/* Comunidad Autónoma */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">Comunidad Autónoma</label>
            <div className="relative">
              <select
                value={form.comunidad}
                onChange={e => setForm(f => ({ ...f, comunidad: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-[#0f1628] border border-white/15 rounded-xl text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none cursor-pointer font-medium"
              >
                <option value="" disabled>-- Selecciona una comunidad --</option>
                {COMUNIDADES.map(c => (
                  <option key={c} value={c} className="bg-[#0f1628] text-white">{c}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30 font-semibold uppercase tracking-widest">Credenciales de acceso</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Usuario (email) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">Usuario (email)</label>
            <input
              type="email"
              value={form.usuario}
              onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
              placeholder="usuario@ejemplo.es"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white/70 uppercase tracking-wider">Contraseña</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Mín. 8 caracteres..."
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-20 bg-white/5 border border-white/15 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  {form.password && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="p-1.5 text-white/40 hover:text-white/80 transition-colors"
                      title="Copiar contraseña"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="p-1.5 text-white/40 hover:text-white/80 transition-colors"
                    title={showPassword ? 'Ocultar' : 'Mostrar'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 hover:text-emerald-300 font-semibold text-sm transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                title="Generar contraseña segura"
              >
                <RefreshCw className="w-4 h-4" />
                Generar
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          {/* Mensaje de estado */}
          {status && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm font-medium ${
              status.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {status.type === 'success'
                ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              }
              {status.msg}
            </div>
          )}

          {/* Botón ALTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 text-lg font-black text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 rounded-xl shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3 tracking-widest"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                ALTA
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
