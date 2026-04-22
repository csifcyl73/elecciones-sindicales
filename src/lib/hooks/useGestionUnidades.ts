"use client";
import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// ─── Tipos ───────────────────────────────────────────────
export interface UnidadElectoral {
  id: string;
  nombre: string;
  estado: string;
  anio?: number | null;
  delegados_a_elegir?: number;
  proceso_electoral_id?: string | null;
  provincias?: { nombre: string } | null;
  tipos_organos?: { nombre: string } | null;
  sectores?: { nombre: string } | null;
}

export interface ProcesoElectoral {
  id: string;
  nombre: string;
  periodo?: string;
  observaciones?: string;
}

export interface UseGestionUnidadesOptions {
  perfil: 'nacional' | 'autonomico';
}

// ─── Hook ────────────────────────────────────────────────
export function useGestionUnidades({ perfil }: UseGestionUnidadesOptions) {
  const [unidades, setUnidades] = useState<UnidadElectoral[]>([]);
  const [procesos, setProcesos] = useState<ProcesoElectoral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [expandedProceso, setExpandedProceso] = useState<string | null>(null);
  const [expandedSinProceso, setExpandedSinProceso] = useState(true);
  const supabase = createClient();

  // Estado para edición de proceso
  const [editingProceso, setEditingProceso] = useState<ProcesoElectoral | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editPeriodo, setEditPeriodo] = useState('');
  const [editObservaciones, setEditObservaciones] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Estado para edición de unidad (asociar proceso + año)
  const [editingUnidad, setEditingUnidad] = useState<UnidadElectoral | null>(null);
  const [editUnidadProcesoId, setEditUnidadProcesoId] = useState('');
  const [editUnidadAnio, setEditUnidadAnio] = useState('');
  const [savingUnidad, setSavingUnidad] = useState(false);

  // Estado para el modal de confirmación de borrado
  const [deleteConfig, setDeleteConfig] = useState<{ id: string, nombre: string, type: 'unidad' | 'proceso' } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  // ─── API Calls ──────────────────────────────────────────

  const loadData = async () => {
    setLoading(true);
    try {
      let unidadesUrl = '/api/admin/unidades';

      // Autonómico filtra por comunidad del usuario
      if (perfil === 'autonomico') {
        const { data: { session } } = await supabase.auth.getSession();
        const userComunidad = session?.user?.user_metadata?.comunidad || '';
        unidadesUrl = `/api/admin/autonomico/unidades?comunidad=${encodeURIComponent(userComunidad)}`;
      }

      const [unidadesResp, procesosResp] = await Promise.all([
        fetch(unidadesUrl).then(r => r.json()).catch(() => []),
        fetch('/api/admin/procesos-electorales').then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(unidadesResp)) setUnidades(unidadesResp);
      if (Array.isArray(procesosResp)) setProcesos(procesosResp);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Handlers: Borrado ─────────────────────────────────

  const executeDelete = async () => {
    if (!deleteConfig) return;
    setIsDeleting(true);
    
    try {
      if (deleteConfig.type === 'unidad') {
        const resp = await fetch('/api/admin/unidades', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: deleteConfig.id })
        });
        if (!resp.ok) { const d = await resp.json(); throw new Error(d.error); }
        setUnidades(unidades.filter(u => u.id !== deleteConfig.id));
      } else {
        const resp = await fetch('/api/admin/procesos-electorales', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: deleteConfig.id })
        });
        if (!resp.ok) { const d = await resp.json(); throw new Error(d.error); }
        setProcesos(procesos.filter(p => p.id !== deleteConfig.id));
        setUnidades(unidades.map(u => u.proceso_electoral_id === deleteConfig.id ? {...u, proceso_electoral_id: null} : u));
      }
      setDeleteConfig(null);
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Handlers: Editar Proceso ──────────────────────────

  const openEditProceso = (p: ProcesoElectoral) => {
    setEditingProceso(p);
    setEditNombre(p.nombre || '');
    setEditPeriodo(p.periodo || '');
    setEditObservaciones(p.observaciones || '');
  };

  const saveEditProceso = async () => {
    if (!editingProceso) return;
    setSavingEdit(true);
    try {
      const resp = await fetch('/api/admin/procesos-electorales', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProceso.id, nombre: editNombre, periodo: editPeriodo, observaciones: editObservaciones })
      });
      if (!resp.ok) { const d = await resp.json(); throw new Error(d.error); }
      const updated = await resp.json();
      setProcesos(procesos.map(p => p.id === editingProceso.id ? { ...p, ...updated } : p));
      setEditingProceso(null);
    } catch (err: any) {
      alert('Error guardando: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // ─── Handlers: Editar Unidad ───────────────────────────

  const openEditUnidad = (u: UnidadElectoral) => {
    setEditingUnidad(u);
    setEditUnidadProcesoId(u.proceso_electoral_id || '');
    setEditUnidadAnio(u.anio?.toString() || '');
  };

  const saveEditUnidad = async () => {
    if (!editingUnidad) return;
    setSavingUnidad(true);
    try {
      const procId = editUnidadProcesoId && editUnidadProcesoId !== 'NO_PROCEDE' ? editUnidadProcesoId : null;
      const anioVal = editUnidadAnio ? parseInt(editUnidadAnio) : null;

      const { error } = await supabase
        .from('unidades_electorales')
        .update({ proceso_electoral_id: procId, anio: anioVal })
        .eq('id', editingUnidad.id);

      if (error) throw error;
      setUnidades(unidades.map(u => u.id === editingUnidad.id ? { ...u, proceso_electoral_id: procId, anio: anioVal } : u));
      setEditingUnidad(null);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingUnidad(false);
    }
  };

  // ─── Utilidades ────────────────────────────────────────

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'configuracion':
        return { text: 'Borrador', badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: 'clock' as const };
      case 'activa':
        return { text: 'Activa', badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: 'check' as const };
      case 'escrutinio':
        return { text: 'Escrutinio', badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: 'chart' as const };
      default:
        return { text: estado, badgeClass: 'bg-white/5 text-white/40', icon: null };
    }
  };

  // ─── Derivados ─────────────────────────────────────────

  const filtered = unidades.filter(u => {
    // Si la unidad está congelada, ya pasó al histórico, la quitamos de este panel interactivo
    if (u.estado === 'congelada') return false;
    
    const term = searchTerm.toUpperCase();
    const matchesSearch = u.nombre.toUpperCase().includes(term) || 
                         (u.provincias?.nombre || '').toUpperCase().includes(term) ||
                         (u.anio?.toString() || '').includes(term);
    const matchesFilter = filterState === 'all' || u.estado === filterState;
    return matchesSearch && matchesFilter;
  });

  const unidadesPorProceso = (procesoId: string) => filtered.filter(u => u.proceso_electoral_id === procesoId);
  
  const unidadesSinProceso = filtered.filter(u => {
    if (!u.proceso_electoral_id || u.proceso_electoral_id === 'NO_PROCEDE') return true;
    // Si el ID de proceso tiene valor pero NO existe en nuestro listado, se muestra aquí para no quedar oculto
    return !procesos.some(p => p.id === u.proceso_electoral_id);
  });

  // Ruta base para links dentro de la página
  const basePath = perfil === 'nacional' ? '/admin/nacional' : '/admin/autonomico';

  // ─── Return ────────────────────────────────────────────

  return {
    // Estado principal
    unidades,
    procesos,
    loading,
    searchTerm,
    setSearchTerm,
    filterState,
    setFilterState,
    expandedProceso,
    setExpandedProceso,
    expandedSinProceso,
    setExpandedSinProceso,

    // Derivados
    filtered,
    unidadesPorProceso,
    unidadesSinProceso,
    basePath,

    // Editar proceso
    editingProceso,
    setEditingProceso,
    editNombre,
    setEditNombre,
    editPeriodo,
    setEditPeriodo,
    editObservaciones,
    setEditObservaciones,
    savingEdit,
    openEditProceso,
    saveEditProceso,

    // Editar unidad
    editingUnidad,
    setEditingUnidad,
    editUnidadProcesoId,
    setEditUnidadProcesoId,
    editUnidadAnio,
    setEditUnidadAnio,
    savingUnidad,
    openEditUnidad,
    saveEditUnidad,

    // Borrado
    deleteConfig,
    setDeleteConfig,
    isDeleting,
    executeDelete,

    // Utilidades
    getStatusBadge,
  };
}
