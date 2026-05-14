/**
 * Sistema de Autenticação Simples
 * Gerencia login, registro e isolamento de dados por usuário
 */


const API_URL = 'https://pebble-barcode-epidermal.ngrok-free.dev';
const AUTH_KEY = 'sandbox-users-v1';
const CURRENT_USER_KEY = 'sandbox-current-user-v1';

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: String(user.email || '').trim().toLowerCase(),
    role: user.role || 'responsavel'
  };
}

function persistUsers(users) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(users.map(sanitizeUser)));
}

function upsertStoredUser(user) {
  const sanitized = sanitizeUser(user);
  const users = getAllUsers();
  const index = users.findIndex(item => item.email === sanitized.email);

  if (index >= 0) {
    users[index] = { ...users[index], ...sanitized };
  } else {
    users.unshift(sanitized);
  }

  persistUsers(users);
  return sanitized;
}


// Registrar novo usuário
async function registerUser(name, email, password, role = 'responsavel') {
  if (String(name || '').trim().length < 3)
    throw new Error('Informe um nome com pelo menos 3 caracteres');

  if (password.length < 6 || !/[A-Za-z]/.test(password) || !/\d/.test(password))
    throw new Error('A senha deve ter pelo menos 6 caracteres, com letras e números');

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const res = await fetch(`${API_URL}/cadastro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome: name.trim(), email: normalizedEmail, senha: password, role })
  });

  const data = await res.json();
  if (!res.ok) {
    if (String(data.erro || '').includes('já cadastrado')) {
      return loginUser(normalizedEmail, password);
    }
    throw new Error(data.erro || 'Erro ao criar conta.');
  }

  const newUser = {
    id: data.id,
    name: data.nome || name.trim(),
    email: normalizedEmail,
    role: data.role || role
  };

  setCurrentUser(newUser);
  return newUser;
}

// Login de usuário
async function loginUser(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizedEmail, senha: password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.erro || 'E-mail ou senha incorretos.');

  const user = {
    id: data.id,
    name: data.nome,
    email: normalizedEmail,
    role: data.role || 'responsavel'
  };

  setCurrentUser(user);
  return user;
}

// Logout
function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// Obter usuário atual
function getCurrentUser() {
  const userJson = localStorage.getItem(CURRENT_USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
}

// Definir usuário atual
function setCurrentUser(user) {
  const sanitized = upsertStoredUser(user);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sanitized));

  if (typeof window.linkCandidateToUser === 'function') {
    window.linkCandidateToUser(sanitized);
  }
}

// Obter todos os usuários
function getAllUsers() {
  const usersJson = localStorage.getItem(AUTH_KEY);
  if (!usersJson) return [];

  try {
    const users = JSON.parse(usersJson);
    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error('Nao foi possivel ler os usuarios salvos.', error);
    return [];
  }
}

// Verificar se está autenticado
function isAuthenticated() {
  return getCurrentUser() !== null;
}

// Verificar se é responsável
function isResponsavel() {
  return getCurrentUser()?.role === 'responsavel';
}

// Verificar se é candidato
function isCandidato() {
  return getCurrentUser()?.role === 'candidato';
}

// Obter candidatos do usuário responsável
function getCandidatosByUser(userId) {
  const current = getCurrentUser();
  const currentEmail = normalizeEmail(current?.email || '');

  return getAllStoredCandidates().filter(candidate => {
    const ownerEmail = normalizeEmail(candidate?.ownerEmail || '');
    const byId = candidate?.userId === userId;
    const byEmail = Boolean(ownerEmail) && ownerEmail === currentEmail;
    const legacyNoOwner = !candidate?.userId && !ownerEmail;
    return byId || byEmail || legacyNoOwner;
  });
}

// Obter candidato específico pelo usuário candidato autenticado
function getCandidatoByUserId(userId) {
  return getCandidateByAccountUserId(userId);
}
