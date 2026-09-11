import React, { useState, useEffect } from 'react';
import { fetchRooms, fetchBookings, createBooking, deleteBooking } from './api/bookingApi';
import { Clock, User, BookOpen, Plus, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const TURNS = ['Manhã', 'Tarde', 'Noite'];

const WEEK_DATES = {
  'Segunda': '2026-09-07',
  'Terça': '2026-09-08',
  'Quarta': '2026-09-09',
  'Quinta': '2026-09-10',
  'Sexta': '2026-09-11',
};

const TURN_HOURS = {
  'Manhã': { start: '08:00:00', end: '11:40:00' },
  'Tarde': { start: '13:30:00', end: '17:10:00' },
  'Noite': { start: '18:30:00', end: '22:00:00' },
};

export default function App() {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    day: 'Segunda',
    turn: 'Manhã',
    professor_name: '',
    subject: '',
  });

  const [feedback, setFeedback] = useState({ type: '', message: '' });

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

  async function handleCreateBooking(e) {
    e.preventDefault();
    setFeedback({ type: '', message: '' });

    const selectedDate = WEEK_DATES[formData.day];
    const { start, end } = TURN_HOURS[formData.turn];

    const payload = {
      room_id: selectedRoom,
      professor_name: formData.professor_name,
      subject: formData.subject,
      turn: formData.turn,
      start_time: `${selectedDate}T${start}`,
      end_time: `${selectedDate}T${end}`,
    };

    try {
      await createBooking(payload);
      setFeedback({ type: 'success', message: 'Reserva confirmada com sucesso!' });
      setFormData({ day: 'Segunda', turn: 'Manhã', professor_name: '', subject: '' });
      setShowModal(false);
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  }

  async function handleDeleteBooking(id) {
    if (!window.confirm('Tem certeza que deseja cancelar esta reserva?')) return;
    try {
      await deleteBooking(id);
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message });
    }
  }

  const activeBookings = bookings.filter((b) => b.room_id === selectedRoom);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestão de Salas FCAP</h1>
            <p className="text-blue-200 text-sm">Controle de Ocupação Semanal - Térreo</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow transition cursor-pointer"
          >
            <Plus size={18} />
            Nova Reserva
          </button>
        </div>
      </header>

      {feedback.message && (
        <div className="max-w-7xl mx-auto px-6 mt-4 w-full">
          <div
            className={`p-4 rounded-lg flex items-center gap-3 border ${
              feedback.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {feedback.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            <span className="font-medium text-sm">{feedback.message}</span>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 w-full">
        {/* Seleção de Salas */}
        <div className="flex gap-3 mb-6">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`px-5 py-2.5 rounded-lg font-semibold transition border cursor-pointer ${
                selectedRoom === room.id
                  ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>

        {/* Grade Semanal */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-6 bg-slate-100 border-b border-slate-200 text-center font-bold text-slate-700 py-3">
            <div className="text-slate-500 font-medium">Turno</div>
            {DAYS_OF_WEEK.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {TURNS.map((turn) => (
            <div key={turn} className="grid grid-cols-6 border-b border-slate-100 min-h-[120px]">
              <div className="p-4 bg-slate-50/50 border-r border-slate-200 flex flex-col justify-center items-center text-center">
                <span className="font-bold text-slate-800">{turn}</span>
                <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={12} />
                  {turn === 'Manhã' ? '08:00 - 11:40' : turn === 'Tarde' ? '13:30 - 17:10' : '18:30 - 22:00'}
                </span>
              </div>

              {DAYS_OF_WEEK.map((day) => {
                const datePrefix = WEEK_DATES[day];
                const booking = activeBookings.find(
                  (b) => b.turn === turn && b.start_time.startsWith(datePrefix)
                );

                return (
                  <div key={day} className="p-2 border-r border-slate-100 flex flex-col justify-center">
                    {booking ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm flex flex-col justify-between h-full shadow-sm relative group">
                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition cursor-pointer"
                          title="Cancelar Reserva"
                        >
                          <Trash2 size={15} />
                        </button>
                        <div>
                          <div className="font-semibold text-blue-900 flex items-center gap-1.5 line-clamp-1">
                            <BookOpen size={14} className="text-blue-600 flex-shrink-0" />
                            <span>{booking.subject}</span>
                          </div>
                          <div className="text-slate-600 text-xs mt-2 flex items-center gap-1.5">
                            <User size={13} className="text-slate-400 flex-shrink-0" />
                            <span>{booking.professor_name}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                          Ocupado
                        </div>
                      </div>
                    ) : (
                      <div className="h-full border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-300">
                        Disponível
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* Modal Formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl border border-slate-100 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800">Nova Reserva de Sala</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Sala</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm bg-slate-50"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Dia da Semana</label>
                  <select
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
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
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm"
                  >
                    {TURNS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Professor(a)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prof. Carlos"
                  value={formData.professor_name}
                  onChange={(e) => setFormData({ ...formData, professor_name: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Disciplina / Evento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Teoria Geral da Administração"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-blue-500"
                />
              </div>

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
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}