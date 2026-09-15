import api from '../services/api';

export async function fetchRooms() {
  try {
    const response = await api.get('/rooms');
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Erro ao carregar salas.');
  }
}

export async function fetchBookings() {
  try {
    const response = await api.get('/bookings');
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.error || 'Erro ao carregar reservas.');
  }
}

export async function createBooking(data) {
  try {
    const response = await api.post('/bookings', data);
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Erro ao realizar agendamento.';
    throw new Error(message);
  }
}

export async function deleteBooking(id) {
  try {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Erro ao cancelar agendamento.';
    throw new Error(message);
  }
}

export async function updateBooking(id, data) {
  try {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data;
  } catch (err) {
    const message =
      err.response?.data?.message ||
      err.response?.data?.error ||
      'Erro ao atualizar agendamento.';
    throw new Error(message);
  }
}