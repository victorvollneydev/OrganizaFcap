const BASE_URL = 'http://localhost:5000/api';

export async function fetchRooms() {
  const response = await fetch(`${BASE_URL}/rooms`);
  if (!response.ok) throw new Error('Erro ao carregar salas.');
  return response.json();
}

export async function fetchBookings() {
  const response = await fetch(`${BASE_URL}/bookings`);
  if (!response.ok) throw new Error('Erro ao carregar reservas.');
  return response.json();
}

export async function createBooking(data) {
  const response = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || result.error || 'Erro ao realizar agendamento.');
  }
  return result;
}

export async function deleteBooking(id) {
  const response = await fetch(`${BASE_URL}/bookings/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Erro ao cancelar agendamento.');
  return response.json();
}