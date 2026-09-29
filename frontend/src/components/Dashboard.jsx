import React, { useState, useEffect } from 'react';
import { 
  fetchRooms, 
  fetchBookings, 
  createBooking, 
  deleteBooking, 
  updateBooking 
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
  XCircle
} from 'lucide-react';
import logoIcon from '../assets/logo-icon.png';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TURNS = ['Manhã', 'Tarde', 'Noite'];

// Mapeamento do getDay() do JavaScript (1 = Segunda ... 6 = Sábado)
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

export default function Dashboard({ user, onLogout }) {
  const isCoordenacao = user?.role === 'coordenacao';

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Controle do Modal de Reservas
  const [showModal, setShowModal] = useState(false);
  const [editBookingId, setEditBookingId] = useState(null);

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
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [roomsData, bookingsData] = await Promise.all([fetchRooms(), fetchBookings()]);
      setRooms(roomsData);
      setBookings(bookingsData);
      if (roomsData.length > 0 && !selectedRoom) {
        setSelectedRoom(roomsData[0].id);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Falha ao conectar com o servidor da FCAP.' });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenNewModal() {
    if (!isCoordenacao) return;
    setEditBookingId(null);
    setFormData({
      day: 'Segunda',
      turn: 'Manhã',
      course: 'Administração',
      professor_name: '',
      subject: '',
      reservation_type: 'recorrente',
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
      {/* Header Institucional */}
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
        {/* Seletor de Salas com Bloco e Andar */}
        {(() => {
          const currentRoomData = rooms.find((r) => r.id === selectedRoom);
          return (
            <div className="mb-4">
              <div className="flex gap-2.5 overflow-x-auto pb-2">
                {rooms.map((room) => {
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
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>{room.name}</span>
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

              {/* Destaque de Acessibilidade e Legenda */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                {currentRoomData && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#1E3A8A',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    <span>📍 {currentRoomData.name}</span>
                    <span>|</span>
                    <span>
                      {currentRoomData.building 
                        ? (currentRoomData.building.toLowerCase().startsWith('bloco') ? currentRoomData.building : `Bloco ${currentRoomData.building}`)
                        : 'Bloco A'}
                    </span>
                    <span>|</span>
                    <span style={{ color: currentRoomData.floor === 'Térreo' ? '#16A34A' : '#1E3A8A' }}>
                      {currentRoomData.floor || 'Térreo'} {currentRoomData.floor === 'Térreo' && '✓ (Acesso Facilitado)'}
                    </span>
                  </div>
                )}

                {/* Legenda Institucional Limpa */}
                <div className="flex items-center gap-3 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-500 uppercase text-[10px] tracking-wider">Legenda:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 border border-blue-700"></span>
                    <span>Aula Regular (Semanal)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600"></span>
                    <span>Eventual / Extra</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Grade Semanal com Rolagem Horizontal Suave */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
          <div className="min-w-[880px]">
            {/* Cabeçalho da Grade: 7 Colunas (Turno + 6 Dias) */}
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

            {/* Linhas de Turnos */}
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
                  // Sábado à noite não tem expediente
                  if (day === 'Sábado' && turn === 'Noite') {
                    return (
                      <div 
                        key={day} 
                        className="p-2 border-r border-slate-100 bg-slate-50/80 flex flex-col items-center justify-center text-center text-slate-400 select-none"
                      >
                        <XCircle size={18} className="text-slate-300 mb-1" />
                        <span className="text-[11px] font-semibold text-slate-400">Sem Expediente</span>
                        <span className="text-[10px] text-slate-400">Noturno</span>
                      </div>
                    );
                  }

                  const targetDate = WEEK_DATES[day];

                  // Identificação de Reserva: Recorrente (por dia da semana) vs Eventual (por data exata)
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
                          {/* Ações da Coordenação */}
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
                            {/* Badges */}
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

                            {/* Disciplina ou Motivo */}
                            <div className={`font-semibold text-xs flex items-start gap-1 line-clamp-2 leading-snug ${
                              isEventual ? 'text-amber-950' : 'text-blue-950'
                            } ${isCoordenacao ? 'pr-8' : ''}`}>
                              <BookOpen size={13} className={isEventual ? 'text-amber-700 flex-shrink-0 mt-0.5' : 'text-blue-600 flex-shrink-0 mt-0.5'} />
                              <span>{booking.subject}</span>
                            </div>

                            {/* Professor Responsável */}
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
      </main>

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
              {/* Seletor de Tipo de Atividade */}
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

              {/* Sala */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Sala</label>
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

              {/* Curso / Programa */}
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

              {/* Dia da Semana e Turno */}
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

              {/* Professor */}
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

              {/* Disciplina / Título */}
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