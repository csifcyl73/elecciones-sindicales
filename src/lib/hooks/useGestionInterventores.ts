"use client";
import React, { useEffect, useState } from 'react';

// ─── Tipos ───────────────────────────────────────────────
export interface InterventorFormData {
  nombre: string;
  email: string;
  password: string;
  telefono: string;
  enviarEmail: boolean;
}

export interface UseGestionInterventoresOptions {
  perfil: 'nacional' | 'autonomico';
}

// ─── Hook ────────────────────────────────────────────────
export function useGestionInterventores({ perfil }: UseGestionInterventoresOptions) {
  const [interventores, setInterventores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<InterventorFormData>({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    enviarEmail: true
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadInterventores();
  }, []);

  // ─── API Calls ──────────────────────────────────────────

  const loadInterventores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/interventores');
      const data = await response.json();
      if (Array.isArray(data)) setInterventores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Handlers ───────────────────────────────────────────

  const generatePassword = () => {
    const p = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '#';
    setFormData({ ...formData, password: p });
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ nombre: '', email: '', password: '', telefono: '', enviarEmail: true });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const openEdit = (u: any) => {
    setEditingId(u.id);
    setFormData({
      nombre: u.user_metadata?.nombre || '',
      email: u.email || '',
      password: '',
      telefono: u.user_metadata?.telefono || '',
      enviarEmail: false
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      if (!editingId && !formData.password) throw new Error("La contraseña es obligatoria para nuevos interventores");

      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch('/api/admin/interventores', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...formData } : formData),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      if (formData.enviarEmail && formData.password) {
        const subject = encodeURIComponent(`Tus credenciales de acceso - Elecciones Sindicales CSIF`);
        const body = encodeURIComponent(
          `Hola, ${formData.nombre.toUpperCase()}:\n\n` +
          `Se han generado tus credenciales de acceso para el sistema de elecciones sindicales de CSIF.\n\n` +
          `🌐 Acceso: https://elecciones-sindicales.vercel.app\n` +
          `📧 Usuario: ${formData.email}\n` +
          `🔑 Contraseña: ${formData.password}\n\n` +
          `Por favor, accede al portal para validar tu cuenta e iniciar tu gestión.\n\n` +
          `Atentamente,\n\n` +
          `Departamento de Elecciones Sindicales\n` +
          `CSIF`
        );
        window.location.href = `mailto:${formData.email}?subject=${subject}&body=${body}`;
      }

      setFormData({ nombre: '', email: '', password: '', telefono: '', enviarEmail: true });
      setIsModalOpen(false);
      loadInterventores();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteInterventor = async (id: string, email: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${email.toUpperCase()}?`)) return;
    try {
      const response = await fetch(`/api/admin/interventores?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        setInterventores(interventores.filter(u => u.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Derivados ──────────────────────────────────────────

  const filtered = interventores.filter(u =>
    u.user_metadata?.nombre?.toUpperCase().includes(searchTerm.toUpperCase()) ||
    u.email.toUpperCase().includes(searchTerm.toUpperCase())
  );

  // ─── Return ─────────────────────────────────────────────

  return {
    interventores,
    loading,
    searchTerm,
    setSearchTerm,
    filtered,

    // Modal
    isModalOpen,
    setIsModalOpen,
    editingId,
    formData,
    setFormData,
    saving,
    errorMsg,

    // Acciones
    openNew,
    openEdit,
    handleSave,
    generatePassword,
    deleteInterventor,
  };
}
