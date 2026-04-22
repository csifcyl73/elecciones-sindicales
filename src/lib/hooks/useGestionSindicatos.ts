"use client";
import React, { useEffect, useState, useRef } from 'react';

// ─── Tipos ───────────────────────────────────────────────
export interface Sindicato {
  id: number;
  siglas: string;
  nombre_completo: string;
  es_federacion?: boolean;
  federacion_id?: number | null;
}

export interface UseGestionSindicatosOptions {
  perfil: 'nacional' | 'autonomico';
}

// ─── Hook ────────────────────────────────────────────────
export function useGestionSindicatos({ perfil }: UseGestionSindicatosOptions) {
  const [sindicatos, setSindicatos] = useState<Sindicato[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados Modal Edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSindicato, setSelectedSindicato] = useState<Sindicato | null>(null);
  const [editSiglas, setEditSiglas] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editEsFederacion, setEditEsFederacion] = useState(false);
  const [editFederacionId, setEditFederacionId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Estados Modal Añadir
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSiglas, setNewSiglas] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newEsFederacion, setNewEsFederacion] = useState(false);
  const [newFederacionId, setNewFederacionId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  // Estado inline "Nueva Federación" (compartido por ambos modales)
  const [showNewFedForm, setShowNewFedForm] = useState<'edit' | 'add' | null>(null);
  const [newFedSiglas, setNewFedSiglas] = useState('');
  const [newFedNombre, setNewFedNombre] = useState('');
  const [savingNewFed, setSavingNewFed] = useState(false);

  // Estados Importación (solo Nacional)
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSindicatos();
  }, []);

  // ─── API Calls ──────────────────────────────────────────

  const loadSindicatos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sindicatos');
      const data = await res.json();
      setSindicatos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Handlers ───────────────────────────────────────────

  const handleEditClick = (s: Sindicato) => {
    setSelectedSindicato(s);
    setEditSiglas(s.siglas);
    setEditNombre(s.nombre_completo);
    setEditEsFederacion(s.es_federacion || false);
    setEditFederacionId(s.federacion_id || null);
    setShowNewFedForm(null);
    setNewFedSiglas('');
    setNewFedNombre('');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSiglas.trim() || !editNombre.trim() || !selectedSindicato) return;
    setSaving(true);
    try {
      const response = await fetch('/api/admin/sindicatos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSindicato.id,
          siglas: editSiglas.toUpperCase(),
          nombre_completo: editNombre.toUpperCase(),
          es_federacion: editEsFederacion,
          federacion_id: editFederacionId
        }),
      });
      if (!response.ok) throw new Error('Error al actualizar');

      const updated = await response.json();
      setSindicatos(sindicatos.map(s => s.id === updated.id ? updated : s));
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiglas.trim() || !newNombre.trim()) return;
    setAdding(true);
    try {
      const response = await fetch('/api/admin/sindicatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siglas: newSiglas.toUpperCase(),
          nombre_completo: newNombre.toUpperCase(),
          es_federacion: newEsFederacion,
          federacion_id: newFederacionId
        }),
      });
      if (!response.ok) throw new Error('Error al añadir');

      const created = await response.json();
      setSindicatos([...sindicatos, created]);
      setIsAddModalOpen(false);
      setNewSiglas('');
      setNewNombre('');
      setNewFederacionId(null);
      setNewEsFederacion(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleCreateFederacionInline = async (context: 'edit' | 'add') => {
    if (!newFedSiglas.trim() || !newFedNombre.trim()) return;
    setSavingNewFed(true);
    try {
      const response = await fetch('/api/admin/sindicatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siglas: newFedSiglas.toUpperCase(),
          nombre_completo: newFedNombre.toUpperCase(),
          es_federacion: true,
          federacion_id: null
        }),
      });
      if (!response.ok) throw new Error('Error al crear federación');
      const created = await response.json();
      // Añadir a la lista local
      setSindicatos(prev => [...prev, created]);
      // Asignar al modal activo
      if (context === 'edit') setEditFederacionId(created.id);
      else setNewFederacionId(created.id);
      // Limpiar form inline
      setNewFedSiglas('');
      setNewFedNombre('');
      setShowNewFedForm(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingNewFed(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de borrar este sindicato? Esto lo eliminará permanentemente de todos los listados.')) return;
    try {
      const res = await fetch(`/api/admin/sindicatos?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al borrar');
      setSindicatos(sindicatos.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openAddModal = () => {
    setNewSiglas('');
    setNewNombre('');
    setNewEsFederacion(false);
    setNewFederacionId(null);
    setShowNewFedForm(null);
    setIsAddModalOpen(true);
  };

  // ─── Importación Excel (solo Nacional) ──────────────────

  const handleDownloadTemplate = () => {
    // Importación dinámica para no cargar xlsx en autonómico
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet([{ 'Siglas': '', 'Nombre_completo': '' }]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sindicatos");
      XLSX.writeFile(wb, "Plantilla_Sindicatos.xlsx");
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet);

        const payload = json.map((row: any) => ({
          siglas: (row['Siglas'] || row['SIGLAS'] || '').toString().trim().toUpperCase(),
          nombre_completo: (row['Nombre_completo'] || row['NOMBRE_COMPLETO'] || row['Nombre completo'] || '').toString().trim().toUpperCase()
        })).filter((s: any) => s.siglas && s.nombre_completo);

        if (payload.length === 0) {
          alert('El archivo no contiene filas válidas (recuerda que Siglas y Nombre_completo son obligatorios o tal vez las columnas no se llaman así).');
          return;
        }

        const res = await fetch('/api/admin/sindicatos/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (!res.ok) throw new Error(result.error || 'Error importando sindicatos');

        alert(`Importación completada:\n- ${result.imported} Importados\n- ${result.duplicated} Omitidos (Duplicados)`);
        loadSindicatos();

      } catch (err: any) {
        alert('Hubo un error importando el archivo: ' + err.message);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      alert("Error leyendo el archivo");
      setImporting(false);
    };

    reader.readAsBinaryString(file);
  };

  // ─── Derivados ──────────────────────────────────────────

  const federaciones = sindicatos.filter(s => s.es_federacion && (!selectedSindicato || s.id !== selectedSindicato.id));

  const filtered = (sindicatos || []).filter(s =>
    (s.siglas?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (s.nombre_completo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // ─── Return ─────────────────────────────────────────────

  return {
    // Estado de lista
    sindicatos,
    loading,
    searchTerm,
    setSearchTerm,
    filtered,
    federaciones,

    // Modal Edición
    isEditModalOpen,
    setIsEditModalOpen,
    selectedSindicato,
    editSiglas,
    setEditSiglas,
    editNombre,
    setEditNombre,
    editEsFederacion,
    setEditEsFederacion,
    editFederacionId,
    setEditFederacionId,
    saving,

    // Modal Añadir
    isAddModalOpen,
    setIsAddModalOpen,
    newSiglas,
    setNewSiglas,
    newNombre,
    setNewNombre,
    newEsFederacion,
    setNewEsFederacion,
    newFederacionId,
    setNewFederacionId,
    adding,

    // Federación inline
    showNewFedForm,
    setShowNewFedForm,
    newFedSiglas,
    setNewFedSiglas,
    newFedNombre,
    setNewFedNombre,
    savingNewFed,

    // Importación (Nacional only)
    importing,
    fileInputRef,

    // Acciones
    handleEditClick,
    handleSaveEdit,
    handleAddNew,
    handleCreateFederacionInline,
    handleDelete,
    openAddModal,
    handleDownloadTemplate,
    handleFileUpload,
  };
}
