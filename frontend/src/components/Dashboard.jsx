import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchRooms, 
  fetchBookings, 
  createBooking, 
  deleteBooking, 
  updateBooking,
  updateRoom
} from '../api/bookingApi';
import { 
  Clock, 
  User, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Edit, 
  AlertCircle, 
  CheckCircle, 
  LogOut,
  XCircle,
  SlidersHorizontal,
  Calendar,
  Layers,
  ChevronDown,
  Building2,
  Sparkles
} from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TURNS = ['Manhã', 'Tarde', 'Noite'];

const DAY_INDEX_MAP = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

function getWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(now.getDate() + diffToMonday);

  const format = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const tuesday = new Date(monday); tuesday.setDate(monday.getDate() + 1);
  const wednesday = new Date(monday); wednesday.setDate(monday.getDate() + 2);
  const thursday = new Date(monday); thursday.setDate(monday.getDate() + 3);
  const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
  const saturday = new Date(monday); saturday.setDate(monday.getDate() + 5);

  return {
    'Segunda': format(monday),
    'Terça': format(tuesday),
    'Quarta': format(wednesday),
    'Quinta': format(thursday),
    'Sexta': format(friday),
    'Sábado': format(saturday),
  };
}

const WEEK_DATES = getWeekDates();

const TURN_HOURS = {
  'Manhã': { start: '07:45:00', end: '11:45:00' },
  'Tarde': { start: '13:00:00', end: '18:00:00' },
  'Noite': { start: '18:30:00', end: '22:30:00' },
};

function getDayNameFromDateString(dateStr) {
  if (!dateStr) return null;
  const rawDate = dateStr.split('T')[0];
  const [year, month, day] = rawDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return DAY_INDEX_MAP[d.getDay()] || null;
}

function isItinerantSpace(room) {
  if (!room || !room.name) return false;
  const lower = room.name.toLowerCase();
  return lower.includes('auditório') || lower.includes('auditorio') || 
         lower.includes('laboratório') || lower.includes('laboratorio') || 
         lower.includes('congregação') || lower.includes('congregacao');
}

export default function Dashboard({ user, onLogout }) {
  const isCoordenacao = user?.role === 'coordenacao';

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Responsividade via JS para evitar falha no Tailwind CDN
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Categoria de espaço ativa: 'salas' (Aulas de semestre) ou 'itinerantes' (Eventos e pontuais)
  const [spaceCategory, setSpaceCategory] = useState('salas');

  // Filtro por Prédio/Bloco para Salas de Aula Normais
  const [selectedBuilding, setSelectedBuilding] = useState('Todos');

  // Alternador de visão principal: 'grade' (Grade Semanal) ou 'livres' (Radar de Salas Livres)
  const [currentView, setCurrentView] = useState('grade');

  // Filtros para o Radar de Salas Livres
  const [freeRoomsFilter, setFreeRoomsFilter] = useState({
    day: 'Segunda',
    turn: 'Noite',
    categoryOnly: 'todas'
  });

  // Modais
  const [showModal, setShowModal] = useState(false);
  const [editBookingId, setEditBookingId] = useState(null);

  const [showRoomDetailsModal, setShowRoomDetailsModal] = useState(false);
  const [roomEditForm, setRoomEditForm] = useState({
    capacity: 55,
    resources: '',
    status: 'Apta para aula'
  });
  const [savingRoom, setSavingRoom] = useState(false);

  const [formData, setFormData] = useState({
    day: 'Segunda',
    turn: 'Manhã',
    course: 'Administração',
    professor_name: '',
    subject: '',
    reservation_type: 'recorrente',
  });

  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const semDisciplina = ['Pós-graduação', 'Mestrado', 'Escola de Aplicação', 'Empresa Júnior'].includes(formData.course);
  const semProfessor = formData.course === 'Empresa Júnior';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [roomsData, bookingsData] = await Promise.all([fetchRooms(), fetchBookings()]);

      const sortedRooms = [...roomsData].sort((a, b) => {
        const buildingA = a.building || 'Bloco A';
        const buildingB = b.building || 'Bloco A';
        const buildingCompare = buildingA.localeCompare(buildingB, 'pt-BR', { sensitivity: 'base' });
        if (buildingCompare !== 0) return buildingCompare;
        return (a.name || '').localeCompare(b.name || '', 'pt-BR', { numeric: true, sensitivity: 'base' });
      });

      setRooms(sortedRooms);
      setBookings(bookingsData);

      if (sortedRooms.length > 0 && !selectedRoom) {
        const firstRegular = sortedRooms.find((r) => !isItinerantSpace(r)) || sortedRooms[0];
        setSelectedRoom(firstRegular.id);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Falha ao conectar com o servidor da FCAP.' });
    } finally {
      setLoading(false);
    }
  }

  // Separação dos grupos de salas
  const regularRooms = useMemo(() => rooms.filter((r) => !isItinerantSpace(r)), [rooms]);
  const itinerantRooms = useMemo(() => rooms.filter((r) => isItinerantSpace(r)), [rooms]);

  // Lista de Blocos únicos presentes nas salas normais
  const availableBuildings = useMemo(() => {
    const bSet = new Set();
    regularRooms.forEach((r) => {
      if (r.building) {
        const formatted = r.building.toLowerCase().startsWith('bloco') 
          ? r.building 
          : `Bloco ${r.building}`;
        bSet.add(formatted);
      } else {
        bSet.add('Bloco A');
      }
    });
    return ['Todos', ...Array.from(bSet).sort()];
  }, [regularRooms]);

  // Filtra as salas da categoria ativa, aplicando o filtro de bloco se for 'salas'
  const currentCategoryRooms = useMemo(() => {
    if (spaceCategory === 'itinerantes') {
      return itinerantRooms;
    }
    if (selectedBuilding === 'Todos') {
      return regularRooms;
    }
    return regularRooms.filter((r) => {
      const bName = r.building 
        ? (r.building.toLowerCase().startsWith('bloco') ? r.building : `Bloco ${r.building}`)
        : 'Bloco A';
      return bName.toLowerCase() === selectedBuilding.toLowerCase();
    });
  }, [spaceCategory, selectedBuilding, regularRooms, itinerantRooms]);

  const currentRoomData = rooms.find((r) => r.id === selectedRoom);

  function handleCategoryChange(newCategory) {
    setSpaceCategory(newCategory);
    const targetList = newCategory === 'salas' 
      ? (selectedBuilding === 'Todos' ? regularRooms : regularRooms.filter((r) => {
          const bName = r.building 
            ? (r.building.toLowerCase().startsWith('bloco') ? r.building : `Bloco ${r.building}`)
            : 'Bloco A';
          return bName.toLowerCase() === selectedBuilding.toLowerCase();
        }))
      : itinerantRooms;

    if (targetList.length > 0) {
      const alreadyInList = targetList.some((r) => r.id === selectedRoom);
      if (!alreadyInList) {
        setSelectedRoom(targetList[0].id);
      }
    }
  }

  function handleBuildingChange(building) {
    setSelectedBuilding(building);
    const filtered = building === 'Todos'
      ? regularRooms
      : regularRooms.filter((r) => {
          const bName = r.building 
            ? (r.building.toLowerCase().startsWith('bloco') ? r.building : `Bloco ${r.building}`)
            : 'Bloco A';
          return bName.toLowerCase() === building.toLowerCase();
        });

    if (filtered.length > 0) {
      const alreadyInList = filtered.some((r) => r.id === selectedRoom);
      if (!alreadyInList) {
        setSelectedRoom(filtered[0].id);
      }
    }
  }

  function handleOpenRoomDetails() {
    if (!currentRoomData) return;
    setRoomEditForm({
      capacity: currentRoomData.capacity || 55,
      resources: currentRoomData.resources || 'Quadro branco, TV, Ar-condicionado',
      status: currentRoomData.status || 'Apta para aula'
    });
    setShowRoomDetailsModal(true);
  }

  async function handleSaveRoomDetails(e) {
    e.preventDefault();
    if (!isCoordenacao || !selectedRoom) return;

    try {
      setSavingRoom(true);
      const res = await updateRoom(selectedRoom, roomEditForm);
      const updated = res.room || res;
      setRooms((prev) => prev.map((r) => (r.id === selectedRoom ? { ...r, ...updated } : r)));
      setShowRoomDetailsModal(false);
      setFeedback({ type: 'success', message: 'Ficha técnica do espaço atualizada com sucesso!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao atualizar dados do espaço.' });
    } finally {
      setSavingRoom(false);
    }
  }

  function handleOpenNewModal() {
    if (!isCoordenacao) return;
    setEditBookingId(null);

    const defaultType = isItinerantSpace(currentRoomData) ? 'eventual' : 'recorrente';

    setFormData({
      day: 'Segunda',
      turn: 'Manhã',
      course: isItinerantSpace(currentRoomData) ? 'Evento' : 'Administração',
      professor_name: '',
      subject: '',
      reservation_type: defaultType,
    });
    setShowModal(true);
  }

  function handleEditClick(booking) {
    if (!isCoordenacao) return;
    const dayName = getDayNameFromDateString(booking.start_time) || 'Segunda';

    setFormData({
      day: dayName,
      turn: booking.turn,
      course: booking.course || 'Administração',
      professor_name: booking.professor_name || '',
      subject: booking.subject || '',
      reservation_type: booking.reservation_type || 'recorrente',
    });
    setEditBookingId(booking.id);
    setShowModal(true);
  }

  async function handleSubmitBooking(e) {
    e.preventDefault();
    if (!isCoordenacao) return;

    if (formData.day === 'Sábado' && formData.turn === 'Noite') {
      setFeedback({ type: 'error', message: 'A FCAP não possui expediente no Sábado à noite.' });
      return;
    }

    setFeedback({ type: '', message: '' });

    const selectedDate = WEEK_DATES[formData.day];
    const { start, end } = TURN_HOURS[formData.turn];

    const payload = {
      room_id: selectedRoom,
      course: formData.course,
      professor_name: semProfessor ? 'Empresa Júnior' : formData.professor_name,
      subject: semDisciplina ? formData.course : formData.subject,
      turn: formData.turn,
      reservation_type: formData.reservation_type,
      start_time: `${selectedDate}T${start}`,
      end_time: `${selectedDate}T${end}`,
    };

    try {
      if (editBookingId) {
        await updateBooking(editBookingId, payload);
        setFeedback({ type: 'success', message: 'Reserva atualizada com sucesso!' });
      } else {
        await createBooking(payload);
        setFeedback({ type: 'success', message: 'Reserva confirmada com sucesso!' });
      }

      setShowModal(false);
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao processar reserva.' });
    }
  }

  async function handleDeleteBooking(id) {
    if (!isCoordenacao) return;
    if (!window.confirm('Tem certeza de que deseja cancelar esta reserva?')) return;
    try {
      await deleteBooking(id);
      loadData();
      setFeedback({ type: 'success', message: 'Reserva cancelada com sucesso.' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Erro ao cancelar reserva.' });
    }
  }

  const activeBookings = bookings.filter((b) => b.room_id === selectedRoom);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Cabeçalho Institucional */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src={logoIcon} 
              alt="FCAP" 
              style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} 
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">Gestão de Salas FCAP</h1>
              <p className="text-blue-200 text-xs">Controle de Ocupação Semanal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isCoordenacao && (
              <button
                onClick={handleOpenNewModal}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium shadow transition cursor-pointer text-xs sm:text-sm"
              >
                <Plus size={16} />
                <span>Nova Reserva</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 bg-blue-950/60 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition cursor-pointer"
                title="Sair"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Alerta de Feedback */}
      {feedback.message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 w-full">
          <div
            className={`p-3 sm:p-4 rounded-lg flex items-center justify-between border ${
              feedback.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
              <span className="font-medium text-xs sm:text-sm">{feedback.message}</span>
            </div>
            <button 
              onClick={() => setFeedback({ type: '', message: '' })}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* Barra Superior: Alternador de Visão (Grade vs Radar de Livres) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setCurrentView('grade')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentView === 'grade'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={14} />
              <span>Grade Semanal</span>
            </button>

            <button
              onClick={() => setCurrentView('livres')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentView === 'livres'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={14} />
              <span>Radar de Salas Livres</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VISÃO 1: GRADE SEMANAL (HÍBRIDA COM FILTRO DE BLOCO)                       */}
        {/* ========================================================================= */}
        {currentView === 'grade' && (
          <>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-4">
              {/* Abas Principais: Salas de Aula vs Itinerantes */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => handleCategoryChange('salas')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      spaceCategory === 'salas'
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 size={13} />
                    <span>Salas de Aula ({regularRooms.length})</span>
                  </button>

                  <button
                    onClick={() => handleCategoryChange('itinerantes')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                      spaceCategory === 'itinerantes'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles size={13} />
                    <span>Espaços Itinerantes ({itinerantRooms.length})</span>
                  </button>
                </div>

                {/* Botão de Ficha Técnica / Editar Sala */}
                {currentRoomData && (
                  <button
                    onClick={handleOpenRoomDetails}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition cursor-pointer shadow-2xs"
                    title="Ver capacidade, equipamentos e status"
                  >
                    <SlidersHorizontal size={13} className="text-blue-800" />
                    <span>{isCoordenacao ? 'Ficha Técnica / Editar' : 'Ficha Técnica'}</span>
                  </button>
                )}
              </div>

              {/* Subfiltro por Bloco/Prédio (Exclusivo para Salas de Aula) */}
              {spaceCategory === 'salas' && availableBuildings.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 border-b border-slate-100 mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Prédio:
                  </span>
                  {availableBuildings.map((building) => {
                    const isSelected = selectedBuilding === building;
                    return (
                      <button
                        key={building}
                        onClick={() => handleBuildingChange(building)}
                        className={`text-xs px-2.5 py-1 rounded-md font-semibold transition cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {building}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Seleção Híbrida: Mobile (Select) vs Desktop (Carrossel) */}
              {isMobile ? (
                /* VISÃO MOBILE (< 768px): Select nativo e compacto */
                <div className="relative mt-2">
                  <select
                    value={selectedRoom || ''}
                    onChange={(e) => setSelectedRoom(Number(e.target.value))}
                    className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg pl-3 pr-8 py-2.5 outline-none focus:ring-2 focus:ring-blue-800/20 cursor-pointer shadow-2xs"
                  >
                    {currentCategoryRooms.map((r) => {
                      const buildingText = r.building 
                        ? (r.building.toLowerCase().startsWith('bloco') ? r.building : `Bloco ${r.building}`)
                        : 'Bloco A';
                      return (
                        <option key={r.id} value={r.id}>
                          {r.name} — {buildingText} ({r.floor || 'Térreo'})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                /* VISÃO DESKTOP (>= 768px): Carrossel de botões clicáveis */
                <div 
                  className="flex gap-2.5 overflow-x-auto pb-1 mt-2"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E1 transparent'
                  }}
                >
                  {currentCategoryRooms.map((room) => {
                    const isSelected = selectedRoom === room.id;
                    const buildingText = room.building
                      ? (room.building.toLowerCase().startsWith('bloco') ? room.building : `Bloco ${room.building}`)
                      : 'Bloco A';

                    return (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          border: isSelected ? '2px solid #193C8A' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#193C8A' : '#FFFFFF',
                          color: isSelected ? '#FFFFFF' : '#334155',
                          boxShadow: isSelected ? '0 4px 6px -1px rgba(25, 60, 138, 0.25)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 0.15s ease',
                          flexShrink: 0
                        }}
                      >
                        <span style={{ fontWeight: '700', fontSize: '13px' }}>{room.name}</span>
                        <span style={{ 
                          fontSize: '11px', 
                          color: isSelected ? '#BFDBFE' : '#64748B',
                          fontWeight: '500'
                        }}>
                          {buildingText} — {room.floor || 'Térreo'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Sub-barra: Localização e Legenda */}
              {currentRoomData && (
                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <span className="font-bold text-slate-800">Localização:</span>
                    <span>
                      {currentRoomData.building 
                        ? (currentRoomData.building.toLowerCase().startsWith('bloco') ? currentRoomData.building : `Bloco ${currentRoomData.building}`)
                        : 'Bloco A'}
                    </span>
                    <span>•</span>
                    <span className={currentRoomData.floor === 'Térreo' ? 'text-emerald-700 font-semibold' : 'text-slate-700'}>
                      {currentRoomData.floor || 'Térreo'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">Capacidade: {currentRoomData.capacity || 55} lugares</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-blue-700"></span>
                      <span>Aula Regular</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600"></span>
                      <span>Eventual / Extra</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Grade Semanal */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
              <div className="min-w-[880px]">
                <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center font-bold text-slate-700 py-3">
                  <div className="text-slate-500 font-medium">Turno</div>
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex flex-col items-center">
                      <span>{day}</span>
                      <span className="text-[11px] font-normal text-slate-400">
                        {WEEK_DATES[day]?.split('-').reverse().slice(0, 2).join('/')}
                      </span>
                    </div>
                  ))}
                </div>

                {TURNS.map((turn) => (
                  <div key={turn} className="grid grid-cols-7 border-b border-slate-100 min-h-[140px]">
                    <div className="p-3 bg-slate-50/50 border-r border-slate-200 flex flex-col justify-center items-center text-center">
                      <span className="font-bold text-slate-800">{turn}</span>
                      <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {turn === 'Manhã' ? '07:45 - 11:45' : turn === 'Tarde' ? '13:00 - 18:00' : '18:30 - 22:30'}
                      </span>
                    </div>

                    {DAYS_OF_WEEK.map((day) => {
                      // Sábado à noite com destaque em cor mais escura e forte contraste
                      if (day === 'Sábado' && turn === 'Noite') {
                        return (
                          <div 
                            key={day} 
                            className="p-2 border-r border-slate-300 bg-slate-200 flex flex-col items-center justify-center text-center text-slate-600 select-none shadow-inner"
                          >
                            <XCircle size={22} className="text-slate-500 mb-1" />
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Sem Expediente</span>
                            <span className="text-[10px] font-semibold text-slate-500">Prédio Fechado</span>
                          </div>
                        );
                      }

                      const targetDate = WEEK_DATES[day];

                      const booking = activeBookings.find((b) => {
                        if (b.turn !== turn) return false;
                        const bDate = b.start_time?.split('T')[0];

                        if (b.reservation_type === 'recorrente') {
                          return getDayNameFromDateString(bDate) === day;
                        } else {
                          return bDate === targetDate;
                        }
                      });

                      const isEventual = booking?.reservation_type === 'eventual';

                      return (
                        <div key={day} className="p-2 border-r border-slate-100 flex flex-col justify-center">
                          {booking ? (
                            <div className={`rounded-lg p-2.5 text-sm flex flex-col justify-between h-full shadow-sm relative transition-all border-l-4 ${
                              isEventual 
                                ? 'bg-amber-50/70 border-l-amber-500 border-y border-r border-amber-200' 
                                : 'bg-blue-50/70 border-l-blue-600 border-y border-r border-blue-200'
                            }`}>
                              {isCoordenacao && (
                                <div className="absolute top-2 right-2 flex gap-1 bg-white/95 p-1 rounded shadow-xs">
                                  <button
                                    onClick={() => handleEditClick(booking)}
                                    className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                                    title="Editar Reserva"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBooking(booking.id)}
                                    className="text-slate-400 hover:text-red-500 transition cursor-pointer"
                                    title="Cancelar Reserva"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              )}

                              <div>
                                <div className="flex flex-wrap items-center gap-1 mb-1.5">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                    isEventual 
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                      : 'bg-blue-100 text-blue-900 border border-blue-200'
                                  }`}>
                                    {isEventual ? 'Eventual' : 'Regular'}
                                  </span>

                                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 truncate max-w-[105px]">
                                    <GraduationCap size={10} className="flex-shrink-0 text-slate-500" />
                                    <span className="truncate">{booking.course || 'Geral'}</span>
                                  </span>
                                </div>

                                <div className={`font-semibold text-xs flex items-start gap-1 line-clamp-2 leading-snug ${
                                  isEventual ? 'text-amber-950' : 'text-blue-950'
                                } ${isCoordenacao ? 'pr-8' : ''}`}>
                                  <BookOpen size={13} className={isEventual ? 'text-amber-700 flex-shrink-0 mt-0.5' : 'text-blue-600 flex-shrink-0 mt-0.5'} />
                                  <span>{booking.subject}</span>
                                </div>

                                {booking.professor_name && (
                                  <div className="text-slate-600 text-[11px] mt-1 flex items-center gap-1">
                                    <User size={11} className="text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{booking.professor_name}</span>
                                  </div>
                                )}
                              </div>

                              <div className={`mt-2 text-[9px] font-bold px-1.5 py-0.5 rounded text-center w-fit uppercase tracking-wider border ${
                                isEventual
                                  ? 'bg-amber-100/60 text-amber-800 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                                {isEventual ? 'Ocupado (Extra)' : 'Ocupado'}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-xs text-slate-300 hover:bg-slate-50/50 transition">
                              Disponível
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* VISÃO 2: RADAR DE SALAS LIVRES                                            */}
        {/* ========================================================================= */}
        {currentView === 'livres' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Radar de Ocupação Instantânea</h3>
                <p className="text-xs text-slate-500">Consulte quais salas estão desocupadas no dia e turno selecionados.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={freeRoomsFilter.categoryOnly}
                  onChange={(e) => setFreeRoomsFilter({ ...freeRoomsFilter, categoryOnly: e.target.value })}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-50 outline-none focus:border-blue-600"
                >
                  <option value="todas">Todos os Espaços</option>
                  <option value="salas">Apenas Salas de Aula</option>
                  <option value="itinerantes">Apenas Espaços Itinerantes</option>
                </select>

                <select
                  value={freeRoomsFilter.day}
                  onChange={(e) => setFreeRoomsFilter({ ...freeRoomsFilter, day: e.target.value })}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-50 outline-none focus:border-blue-600"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={freeRoomsFilter.turn}
                  onChange={(e) => setFreeRoomsFilter({ ...freeRoomsFilter, turn: e.target.value })}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-50 outline-none focus:border-blue-600"
                >
                  {TURNS.filter((t) => !(freeRoomsFilter.day === 'Sábado' && t === 'Noite')).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms
                .filter((r) => {
                  if (freeRoomsFilter.categoryOnly === 'salas') return !isItinerantSpace(r);
                  if (freeRoomsFilter.categoryOnly === 'itinerantes') return isItinerantSpace(r);
                  return true;
                })
                .map((room) => {
                  const targetDate = WEEK_DATES[freeRoomsFilter.day];

                  const booking = bookings.find((b) => {
                    if (b.room_id !== room.id || b.turn !== freeRoomsFilter.turn) return false;
                    const bDate = b.start_time?.split('T')[0];
                    if (b.reservation_type === 'recorrente') {
                      return getDayNameFromDateString(bDate) === freeRoomsFilter.day;
                    } else {
                      return bDate === targetDate;
                    }
                  });

                  const isFree = !booking;
                  const isItin = isItinerantSpace(room);

                  return (
                    <div
                      key={room.id}
                      className={`rounded-xl p-4 border transition shadow-xs flex flex-col justify-between ${
                        isFree 
                          ? 'bg-emerald-50/40 border-emerald-200' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-slate-800 text-sm">{room.name}</h4>
                              {isItin && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                  Itinerante
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {room.building} — {room.floor || 'Térreo'}
                            </span>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isFree
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {isFree ? 'Disponível' : 'Ocupada'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 space-y-1 mb-3">
                          <p><strong>Capacidade:</strong> {room.capacity || 55} lugares</p>
                          <p className="line-clamp-1"><strong>Recursos:</strong> {room.resources || 'Quadro, TV'}</p>
                          <p className="text-[11px] text-slate-500"><strong>Status:</strong> {room.status || 'Apta para aula'}</p>
                        </div>

                        {!isFree && (
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-0.5">
                            <p className="font-bold text-blue-900 line-clamp-1">{booking.subject}</p>
                            <p className="text-slate-500">{booking.course} {booking.professor_name && `• ${booking.professor_name}`}</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 mt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => {
                            setSpaceCategory(isItin ? 'itinerantes' : 'salas');
                            setSelectedRoom(room.id);
                            setCurrentView('grade');
                          }}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-900 cursor-pointer"
                        >
                          Ver na grade semanal →
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Ficha Técnica / Edição de Espaço */}
      {showRoomDetailsModal && currentRoomData && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md p-5 sm:p-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {currentRoomData.name}
                </h2>
                <p className="text-xs text-slate-500">
                  {currentRoomData.building} — {currentRoomData.floor || 'Térreo'}
                </p>
              </div>
              <button 
                onClick={() => setShowRoomDetailsModal(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isCoordenacao ? (
              <form onSubmit={handleSaveRoomDetails} className="space-y-3.5 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Capacidade (Lugares / Poltronas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={roomEditForm.capacity}
                    onChange={(e) => setRoomEditForm({ ...roomEditForm, capacity: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Equipamentos e Recursos Disponíveis
                  </label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Ex: Projetor Epson, Som integrado, 120 poltronas estofadas"
                    value={roomEditForm.resources}
                    onChange={(e) => setRoomEditForm({ ...roomEditForm, resources: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-600 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    Condições de Funcionamento
                  </label>
                  <select
                    value={roomEditForm.status}
                    onChange={(e) => setRoomEditForm({ ...roomEditForm, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-600 bg-slate-50"
                  >
                    <option value="Apta para aula">Apta para uso (100% Operacional)</option>
                    <option value="Ar-condicionado em manutenção">Ar-condicionado em manutenção</option>
                    <option value="Projetor/TV indisponível">Projetor/Equipamento de som indisponível</option>
                    <option value="Interditada para reforma">Interditada para reforma/manutenção</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRoomDetailsModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={savingRoom}
                    className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition cursor-pointer disabled:opacity-50"
                  >
                    {savingRoom ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 mt-3 text-sm text-slate-700">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Capacidade</span>
                  <p className="font-bold text-slate-800">{currentRoomData.capacity || 55} lugares</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Recursos e Equipamentos</span>
                  <p>{currentRoomData.resources || 'Quadro branco, TV, Ar-condicionado'}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Status de Funcionamento</span>
                  <span className="inline-block mt-0.5 text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {currentRoomData.status || 'Apta para aula'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowRoomDetailsModal(false)}
                  className="w-full mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Reserva de Salas */}
      {showModal && isCoordenacao && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">
                {editBookingId ? 'Editar Reserva de Sala' : 'Nova Reserva de Sala'}
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1.5">
                  Tipo de Ocupação
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, reservation_type: 'recorrente' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer text-center ${
                      formData.reservation_type === 'recorrente'
                        ? 'bg-blue-50 border-blue-600 text-blue-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Aula Regular (Semanal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, reservation_type: 'eventual' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition cursor-pointer text-center ${
                      formData.reservation_type === 'eventual'
                        ? 'bg-amber-50 border-amber-500 text-amber-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Eventual / Aula Extra
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Espaço / Sala</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 outline-none focus:border-blue-600"
                >
                  {rooms.map((r) => {
                    const buildingText = r.building 
                      ? (r.building.toLowerCase().startsWith('bloco') ? r.building : `Bloco ${r.building}`)
                      : 'Bloco A';
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} — {buildingText} ({r.floor || 'Térreo'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Curso / Programa</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50 outline-none focus:border-blue-600"
                >
                  <option value="Administração">Administração</option>
                  <option value="Direito">Direito</option>
                  <option value="Ciências Sociais">Ciências Sociais</option>
                  <option value="Pós-graduação">Pós-graduação</option>
                  <option value="Mestrado">Mestrado</option>
                  <option value="Escola de Aplicação">Escola de Aplicação</option>
                  <option value="Empresa Júnior">Empresa Júnior</option>
                  <option value="Evento">Evento</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Dia da Semana</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-600"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Turno</label>
                  <select
                    value={formData.turn}
                    onChange={(e) => setFormData({ ...formData, turn: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-600"
                  >
                    {TURNS.filter((t) => !(formData.day === 'Sábado' && t === 'Noite')).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!semProfessor && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Professor(a) / Responsável</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prof. Carlos ou Nome do Responsável"
                    value={formData.professor_name}
                    onChange={(e) => setFormData({ ...formData, professor_name: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-600"
                  />
                </div>
              )}

              {!semDisciplina && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                    {formData.reservation_type === 'eventual' ? 'Título do Evento / Atividade' : 'Disciplina'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={formData.reservation_type === 'eventual' ? 'Ex: Defesa de TCC ou Workshop' : 'Ex: Teoria Geral da Administração'}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition cursor-pointer"
                >
                  {editBookingId ? 'Atualizar' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}