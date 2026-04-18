/*
 * Configurações e constantes
 * -------------------------
 * Lista de documentos obrigatórios e elementos do DOM.
 */

// Verificar autenticação ao carregar a página
const currentUser = getCurrentUser();
if (!currentUser) {
  window.location.href = 'login.html';
} else if (currentUser.role === 'candidato') {
  // Se for candidato, redirecionar para página de progresso
  window.location.href = 'progresso-candidato.html';
}

// Documentos obrigatórios para calcular status e pendências
const docsObrigatorios = CANDIDATE_RULES.docsObrigatorios;

// Elementos principais do formulário e da tabela
const campos = {
  id: document.getElementById('candidateId'),
  razaoSocial: document.getElementById('razaoSocial'),
  cnpj: document.getElementById('cnpj'),
  nome: document.getElementById('nome'),
  cpf: document.getElementById('cpf'),
  email: document.getElementById('email'),
  telefone: document.getElementById('telefone'),
  area: document.getElementById('area')
};

const form = document.getElementById('candidateForm');
const tableBody = document.getElementById('tableBody');
const emptyState = document.getElementById('emptyState');
const formFeedback = document.getElementById('formFeedback');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const areaFilter = document.getElementById('areaFilter');
const pendenciaFilter = document.getElementById('pendenciaFilter');
const resultsInfo = document.getElementById('resultsInfo');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');
const editBadge = document.getElementById('editBadge');
const exportBtn = document.getElementById('exportBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const seedDataBtn = document.getElementById('seedDataBtn');
const selectAllDocsBtn = document.getElementById('selectAllDocsBtn');
const deselectAllDocsBtn = document.getElementById('deselectAllDocsBtn');
const themeToggle = document.querySelector('[data-theme-toggle]');
const projectForm = document.getElementById('projectForm');
const projectCandidateId = document.getElementById('projectCandidateId');
const projectFeedback = document.getElementById('projectFeedback');
const backToCadastroBtn = document.getElementById('backToCadastroBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfoEl = document.getElementById('userInfo');

const projectFields = {
  title: document.getElementById('projectTitle'),
  benefit: document.getElementById('projectBenefit'),
  trl: document.getElementById('projectTRL'),
  components: document.getElementById('projectComponents'),
  goals: document.getElementById('projectGoals'),
  society: document.getElementById('projectSociety'),
  risks: document.getElementById('projectRisks'),
  data: document.getElementById('projectData'),
  personalData: document.getElementById('projectPersonalData'),
  rights: document.getElementById('projectRights'),
  notice: document.getElementById('projectNotice'),
  explainability: document.getElementById('projectExplainability'),
  metrics: document.getElementById('projectMetrics'),
  biasMitigation: document.getElementById('projectBiasMitigation'),
  biasEvaluation: document.getElementById('projectBiasEvaluation'),
  testPlan: document.getElementById('projectTestPlan')
};

const kpis = {
  total: document.getElementById('kpiTotal'),
  aptos: document.getElementById('kpiAptos'),
  pendentes: document.getElementById('kpiPendentes'),
  criticos: document.getElementById('kpiCriticos')
};

const tabButtons = document.querySelectorAll('[data-tab]');
const tabPanels = document.querySelectorAll('[data-panel]');
const STORAGE_KEY = CANDIDATE_STORAGE_KEY;
const FORM_DRAFT_KEY = `${STORAGE_KEY}:draft:${currentUser?.id || 'anon'}`;

const projectQuestionFields = [
  { key: 'title', label: '1. Título da solução de IA' },
  { key: 'benefit', label: '2. Benefícios esperados no Sandbox Regulatório' },
  { key: 'trl', label: '3. TRL da solução de IA' },
  { key: 'components', label: '5. Componentes arquiteturais e modelos de IA' },
  { key: 'goals', label: '6. Objetivos da solução de IA' },
  { key: 'society', label: '7. Benefícios para a sociedade' },
  { key: 'risks', label: '8. Riscos mapeados e mitigação' },
  { key: 'data', label: '9. Coleta e tratamento dos dados' },
  { key: 'personalData', label: '10. Uso de dados pessoais ou anonimizados' },
  { key: 'rights', label: '11. Proteção dos direitos fundamentais' },
  { key: 'notice', label: '12. Informação sobre uso dos dados' },
  { key: 'explainability', label: '13. Transparência ou explicabilidade do modelo' },
  { key: 'metrics', label: '14. Métricas de performance' },
  { key: 'biasMitigation', label: '15. Mitigação de viés' },
  { key: 'biasEvaluation', label: '16. Avaliação de viés discriminatório' },
  { key: 'testPlan', label: '17. Plano de testes' }
];

let candidatos = [];
let sortState = { key: 'nome', direction: 'asc' };
let themeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
let activeCandidateId = '';
let expandedProjectIds = new Set();

document.documentElement.setAttribute('data-theme', themeMode);
updateThemeButton();

/*
 * Comportamento de tema
 * ---------------------
 * Controla o tema claro/escuro do aplicativo.
 */
function updateThemeButton() {
  themeToggle.textContent = themeMode === 'dark' ? '☀️ Tema' : '🌙 Tema';
  themeToggle.setAttribute('aria-label', themeMode === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro');
}

themeToggle.addEventListener('click', () => {
  themeMode = themeMode === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', themeMode);
  updateThemeButton();
});

/*
 * Helpers de formulário
 * --------------------
 * Funções auxiliares para exibir mensagens e formatar entradas.
 */
// ---------- Form helpers ----------
function showFeedback(message, type) {
  formFeedback.textContent = message;
  formFeedback.className = `feedback show ${type}`;
}

function hideFeedback() {
  formFeedback.className = 'feedback';
  formFeedback.textContent = '';
}

function showProjectFeedback(message, type) {
  projectFeedback.textContent = message;
  projectFeedback.className = `feedback show ${type}`;
}

function hideProjectFeedback() {
  projectFeedback.className = 'feedback';
  projectFeedback.textContent = '';
}

function escapeHTML(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setFieldValidity(field, isValid = true) {
  if (!field) return;
  field.classList.toggle('input-invalid', !isValid);
  field.setAttribute('aria-invalid', String(!isValid));
}

function invalidateField(field, message, scope = 'candidate') {
  setFieldValidity(field, false);
  if (scope === 'project') {
    showProjectFeedback(message, 'error');
  } else {
    showFeedback(message, 'error');
  }
  field?.focus();
  return false;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || '').trim());
}

function isValidPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
}

function formatCNPJ(value) {
  return value.replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function validarCNPJ(cnpj) {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) return false;

  const calcularDigito = tamanho => {
    let soma = 0;
    let posicao = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += Number(cleaned[tamanho - i]) * posicao--;
      if (posicao < 2) posicao = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(12);
  const segundoDigito = calcularDigito(13);
  return primeiroDigito === Number(cleaned[12]) && segundoDigito === Number(cleaned[13]);
}

const hasCandidateProjectResponses = candidato => window.hasProjectResponses(candidato);
const isCandidateProjectComplete = candidato => window.isProjectComplete(candidato);

function getEmptyProjectData() {
  return projectQuestionFields.reduce((accumulator, { key }) => {
    accumulator[key] = '';
    return accumulator;
  }, {});
}

function normalizeProjectData(projeto = {}) {
  return projectQuestionFields.reduce((accumulator, { key }) => {
    accumulator[key] = String(projeto?.[key] || '').trim();
    return accumulator;
  }, {});
}

function getActiveTabName() {
  const visiblePanel = [...tabPanels].find(panel => panel.style.display !== 'none');
  if (visiblePanel) return visiblePanel.dataset.panel;

  return [...tabButtons].find(button => button.classList.contains('active'))?.dataset.tab || 'dashboard';
}

function getStoredDraft() {
  try {
    const raw = localStorage.getItem(FORM_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Não foi possível recuperar o rascunho do formulário.', error);
    return null;
  }
}

function hasCandidateDraftContent(candidate = {}) {
  return Boolean(
    candidate.nome
    || candidate.cpf
    || candidate.email
    || candidate.telefone
    || candidate.area
    || candidate.razaoSocial
    || candidate.cnpj
    || candidate.documentos?.length
  );
}

function hasProjectDraftContent(project = {}) {
  return Object.values(normalizeProjectData(project)).some(value => value.length > 0);
}

function getCandidateDraftData() {
  return {
    id: campos.id.value || activeCandidateId || '',
    razaoSocial: campos.razaoSocial.value.trim(),
    cnpj: campos.cnpj.value.trim(),
    nome: campos.nome.value.trim(),
    cpf: campos.cpf.value.trim(),
    email: normalizeEmail(campos.email.value),
    telefone: campos.telefone.value.trim(),
    area: campos.area.value,
    documentos: getCheckedDocs()
  };
}

function persistFormDraft(options = {}) {
  try {
    const resolvedCandidateId = options.candidateId !== undefined
      ? options.candidateId
      : (projectCandidateId.value || activeCandidateId || campos.id.value || '');

    const candidateData = options.candidateData
      ? {
          id: options.candidateData.id || resolvedCandidateId,
          razaoSocial: String(options.candidateData.razaoSocial || '').trim(),
          cnpj: String(options.candidateData.cnpj || '').trim(),
          nome: String(options.candidateData.nome || '').trim(),
          cpf: String(options.candidateData.cpf || '').trim(),
          email: normalizeEmail(options.candidateData.email || ''),
          telefone: String(options.candidateData.telefone || '').trim(),
          area: String(options.candidateData.area || '').trim(),
          documentos: Array.isArray(options.candidateData.documentos) ? options.candidateData.documentos : []
        }
      : getCandidateDraftData();

    const draft = {
      activeTab: options.activeTab || getActiveTabName(),
      activeCandidateId: resolvedCandidateId,
      candidate: candidateData,
      project: options.projectData ? normalizeProjectData(options.projectData) : getProjectData(),
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Não foi possível salvar o rascunho do formulário.', error);
  }
}

function persistDraftTab(tab) {
  const draft = getStoredDraft() || {};
  draft.activeTab = tab;
  draft.activeCandidateId = draft.activeCandidateId || projectCandidateId.value || activeCandidateId || campos.id.value || '';
  draft.candidate = draft.candidate || getCandidateDraftData();
  draft.project = draft.project || getProjectData();
  draft.updatedAt = new Date().toISOString();

  try {
    localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
  } catch (error) {
    console.error('Não foi possível atualizar a etapa atual do rascunho.', error);
  }
}

function clearFormDraft() {
  localStorage.removeItem(FORM_DRAFT_KEY);
}

function getDraftProjectData(candidateId = '') {
  const draft = getStoredDraft();
  if (!draft || !hasProjectDraftContent(draft.project)) return null;

  const draftCandidateId = draft.activeCandidateId || draft.candidate?.id || '';
  if (candidateId && draftCandidateId && draftCandidateId !== candidateId) return null;

  return normalizeProjectData(draft.project);
}

function restoreFormDraft() {
  const draft = getStoredDraft();
  if (!draft) return;

  const candidateFromList = candidatos.find(candidate => candidate.id === (draft.activeCandidateId || draft.candidate?.id));
  const candidateData = hasCandidateDraftContent(draft.candidate) ? draft.candidate : (candidateFromList || {});
  const projectData = hasProjectDraftContent(draft.project) ? draft.project : (candidateFromList?.projetoIA || {});
  const hasContent = hasCandidateDraftContent(candidateData) || hasProjectDraftContent(projectData);

  if (!hasContent) return;

  campos.id.value = draft.activeCandidateId || candidateData.id || '';
  activeCandidateId = draft.activeCandidateId || candidateData.id || '';
  projectCandidateId.value = activeCandidateId || '';

  campos.razaoSocial.value = candidateData.razaoSocial || '';
  campos.cnpj.value = candidateData.cnpj || '';
  campos.nome.value = candidateData.nome || '';
  campos.cpf.value = candidateData.cpf || '';
  campos.email.value = candidateData.email || '';
  campos.telefone.value = candidateData.telefone || '';
  campos.area.value = candidateData.area || '';

  const documentosSelecionados = Array.isArray(candidateData.documentos) ? candidateData.documentos : [];
  document.querySelectorAll('input[name="docs"]').forEach(item => {
    item.checked = documentosSelecionados.includes(item.value);
  });

  preencherFormularioProjeto(projectData);

  submitBtn.textContent = campos.id.value ? 'Atualizar e continuar' : 'Próximo';
  if (editBadge && campos.id.value) editBadge.textContent = 'Rascunho recuperado';

  if (draft.activeTab) {
    setActiveTab(draft.activeTab, false);
  }

  if (draft.activeTab === 'projeto-ia') {
    showProjectFeedback('As informações preenchidas foram recuperadas automaticamente.', 'success');
  } else {
    showFeedback('As informações preenchidas foram recuperadas automaticamente.', 'success');
  }
}

function normalizeCandidate(candidate = {}) {
  const documentos = Array.isArray(candidate.documentos) ? candidate.documentos : [];
  const avaliacao = avaliarDocumentos(documentos);
  return {
    id: candidate.id || crypto.randomUUID(),
    userId: candidate.userId || currentUser.id,
    ownerEmail: normalizeEmail(candidate.ownerEmail || currentUser.email),
    candidateAccountUserId: candidate.candidateAccountUserId || null,
    razaoSocial: String(candidate.razaoSocial || '').trim(),
    cnpj: String(candidate.cnpj || '').trim(),
    nome: String(candidate.nome || '').trim(),
    cpf: String(candidate.cpf || '').trim(),
    email: normalizeEmail(candidate.email),
    telefone: String(candidate.telefone || '').trim(),
    area: String(candidate.area || '').trim(),
    documentos,
    projetoIA: normalizeProjectData(candidate.projetoIA),
    pendencias: avaliacao.pendencias,
    status: avaliacao.status,
    pendenciaCritica: avaliacao.pendenciaCritica
  };
}

function belongsToCurrentResponsavel(candidate) {
  const ownerEmail = normalizeEmail(candidate?.ownerEmail || '');
  const currentEmail = normalizeEmail(currentUser?.email || '');
  const byId = candidate?.userId === currentUser.id;
  const byEmail = Boolean(ownerEmail) && ownerEmail === currentEmail;
  const legacyNoOwner = !candidate?.userId && !ownerEmail;
  return byId || byEmail || legacyNoOwner;
}

function persistCandidates() {
  try {
    const outrosCandidatos = getAllStoredCandidates().filter(candidate => !belongsToCurrentResponsavel(candidate));
    const candidatosDoUsuario = candidatos.map(candidate => normalizeCandidate({
      ...candidate,
      userId: currentUser.id,
      ownerEmail: currentUser.email
    }));
    saveAllStoredCandidates([...outrosCandidatos, ...candidatosDoUsuario]);
  } catch (error) {
    console.error('Não foi possível salvar os cadastros localmente.', error);
  }
}

function loadCandidates() {
  try {
    candidatos = getAllStoredCandidates()
      .filter(candidate => belongsToCurrentResponsavel(candidate))
      .map(candidate => normalizeCandidate(candidate));
  } catch (error) {
    console.error('Não foi possível recuperar os cadastros salvos.', error);
    candidatos = [];
  }
}

function renderProjectAnswers(candidato) {
  return projectQuestionFields
    .map(({ key, label }) => {
      const resposta = String(candidato?.projetoIA?.[key] || '').trim() || 'Não informado';
      return `
        <div class="project-answer-item">
          <dt>${escapeHTML(label)}</dt>
          <dd>${escapeHTML(resposta)}</dd>
        </div>
      `;
    })
    .join('');
}

function formatCPF(value) {
  return value.replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function validarCPF(cpf) {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cleaned.charAt(i)) * (10 - i);
  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(cleaned.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cleaned.charAt(i)) * (11 - i);
  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;
  return secondDigit === Number(cleaned.charAt(10));
}


function getCheckedDocs() {
  return [...document.querySelectorAll('input[name="docs"]:checked')].map(item => item.value);
}

function avaliarDocumentos(documentos) {
  const pendencias = docsObrigatorios.filter(doc => !documentos.includes(doc));
  const status = pendencias.length === 0 ? 'Apto' : 'Pendente';
  const pendenciaCritica = pendencias.includes('RG') || pendencias.includes('CPF');
  return { pendencias, status, pendenciaCritica };
}

function limparFormulario(clearDraft = false) {
  const shouldClearDraft = clearDraft === true;
  form.reset();
  campos.id.value = '';
  submitBtn.textContent = 'Próximo';
  if (editBadge) editBadge.textContent = 'Modo criação';
  hideFeedback();

  if (shouldClearDraft) {
    activeCandidateId = '';
    projectCandidateId.value = '';
    clearFormDraft();
  }
}

function preencherFormularioCandidato(candidato) {
  if (!candidato) return;

  campos.id.value = candidato.id;
  campos.razaoSocial.value = candidato.razaoSocial || '';
  campos.cnpj.value = candidato.cnpj || '';
  campos.nome.value = candidato.nome || '';
  campos.cpf.value = candidato.cpf || '';
  campos.email.value = candidato.email || '';
  campos.telefone.value = candidato.telefone || '';
  campos.area.value = candidato.area || '';

  document.querySelectorAll('input[name="docs"]').forEach(item => {
    item.checked = candidato.documentos.includes(item.value);
  });

  submitBtn.textContent = 'Atualizar e continuar';
  if (editBadge) editBadge.textContent = 'Modo edição';
}

function getProjectData() {
  return normalizeProjectData({
    title: projectFields.title.value,
    benefit: projectFields.benefit.value,
    trl: projectFields.trl.value,
    components: projectFields.components.value,
    goals: projectFields.goals.value,
    society: projectFields.society.value,
    risks: projectFields.risks.value,
    data: projectFields.data.value,
    personalData: projectFields.personalData.value,
    rights: projectFields.rights.value,
    notice: projectFields.notice.value,
    explainability: projectFields.explainability.value,
    metrics: projectFields.metrics.value,
    biasMitigation: projectFields.biasMitigation.value,
    biasEvaluation: projectFields.biasEvaluation.value,
    testPlan: projectFields.testPlan.value
  });
}

function preencherFormularioProjeto(projeto = {}) {
  const projectData = { ...getEmptyProjectData(), ...normalizeProjectData(projeto) };
  projectFields.title.value = projectData.title;
  projectFields.benefit.value = projectData.benefit;
  projectFields.trl.value = projectData.trl;
  projectFields.components.value = projectData.components;
  projectFields.goals.value = projectData.goals;
  projectFields.society.value = projectData.society;
  projectFields.risks.value = projectData.risks;
  projectFields.data.value = projectData.data;
  projectFields.personalData.value = projectData.personalData;
  projectFields.rights.value = projectData.rights;
  projectFields.notice.value = projectData.notice;
  projectFields.explainability.value = projectData.explainability;
  projectFields.metrics.value = projectData.metrics;
  projectFields.biasMitigation.value = projectData.biasMitigation;
  projectFields.biasEvaluation.value = projectData.biasEvaluation;
  projectFields.testPlan.value = projectData.testPlan;
}

function limparFormularioProjeto(resetCandidate = false) {
  projectForm.reset();
  preencherFormularioProjeto();
  if (resetCandidate) {
    activeCandidateId = '';
    projectCandidateId.value = '';
  }
  hideProjectFeedback();
}

function hasSavedProject(candidato) {
  return isCandidateProjectComplete(candidato);
}

const getResolvedCandidatePendencias = candidato => window.getCandidatePendencias(candidato);
const getResolvedCandidateStatus = candidato => window.getCandidateStatus(candidato);

function carregarAreas() {
  const areas = [...new Set(candidatos.map(c => c.area))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  areaFilter.innerHTML = '<option value="todos">Todas</option>' + areas.map(area => `<option value="${area}">${area}</option>`).join('');
}

function updateKpis() {
  const total = candidatos.length;
  const aptos = candidatos.filter(c => getResolvedCandidateStatus(c) === 'Apto').length;
  const pendentes = total - aptos;
  const criticos = candidatos.filter(c => isCandidateCritical(c)).length;
  animateNumber(kpis.total, total);
  animateNumber(kpis.aptos, aptos);
  animateNumber(kpis.pendentes, pendentes);
  animateNumber(kpis.criticos, criticos);
}

function animateNumber(element, target) {
  const start = Number(element.dataset.value || 0);
  const duration = 400;
  const startTime = performance.now();
  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.round(start + (target - start) * progress);
    element.textContent = value;
    element.dataset.value = value;
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/*
 * Helpers de tabela
 * -----------------
 * Busca, ordenação e renderização dos candidatos.
 */
// ---------- Table helpers ----------
function getFilteredCandidates() {
  const text = searchInput.value.trim().toLowerCase();
  return candidatos
    .filter(c => {
      const pendenciasCandidato = getResolvedCandidatePendencias(c);
      const statusCandidato = getResolvedCandidateStatus(c);
      const matchText = [c.nome, c.cpf, c.email, c.area].some(v => v.toLowerCase().includes(text));
      const matchStatus = statusFilter.value === 'todos' || statusCandidato === statusFilter.value;
      const matchArea = areaFilter.value === 'todos' || c.area === areaFilter.value;
      const matchPendencia = pendenciaFilter.value === 'todos'
        || (pendenciaFilter.value === 'critica' && isCandidateCritical(c))
        || (pendenciaFilter.value === 'nenhuma' && pendenciasCandidato.length === 0);
      return matchText && matchStatus && matchArea && matchPendencia;
    })
    .sort((a, b) => {
      const dir = sortState.direction === 'asc' ? 1 : -1;
      return String(a[sortState.key]).localeCompare(String(b[sortState.key]), 'pt-BR') * dir;
    });
}

function renderTable() {
  const dados = getFilteredCandidates();
  tableBody.innerHTML = '';
  emptyState.style.display = dados.length ? 'none' : 'block';
  resultsInfo.textContent = `${dados.length} candidato(s) exibido(s) de ${candidatos.length} cadastrado(s).`;

  dados.forEach(c => {
    const pendenciasCandidato = getResolvedCandidatePendencias(c);
    const statusCandidato = getResolvedCandidateStatus(c);
    const projectSaved = hasCandidateProjectResponses(c);
    const isExpanded = expandedProjectIds.has(c.id);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <strong>${escapeHTML(c.nome)}</strong><br>
        <span style="color:var(--color-text-muted);">CPF ${escapeHTML(c.cpf)}</span>
      </td>
      <td>${escapeHTML(c.area)}</td>
      <td>${escapeHTML(c.email)}<br>${escapeHTML(c.telefone)}</td>
      <td>
        ${pendenciasCandidato.length ? `<ul class="pending-list">${pendenciasCandidato.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>` : 'Nenhuma'}
      </td>
      <td><span class="badge ${statusCandidato === 'Apto' ? 'apto' : 'pendente'}">${statusCandidato}</span></td>
      <td>
        <div class="actions-cell">
          <button class="mini-btn" type="button" data-edit="${c.id}">Editar</button>
          <button class="mini-btn" type="button" data-toggle-project="${c.id}" ${projectSaved ? '' : 'disabled'}>${isExpanded ? 'Ocultar questionário' : 'Ver questionário'}</button>
          <button class="mini-btn delete" type="button" data-delete="${c.id}">Excluir</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);

    if (projectSaved && isExpanded) {
      const detailRow = document.createElement('tr');
      detailRow.className = 'project-row';
      detailRow.innerHTML = `
        <td colspan="6" class="project-row-cell">
          <section class="project-summary" aria-label="Respostas do questionário de Projeto de IA de ${escapeHTML(c.nome)}">
            <div class="project-summary-head">
              <strong>Respostas do questionário de Projeto de IA</strong>
              <span class="badge projeto-salvo">Registrado</span>
            </div>
            <dl class="project-answer-list">
              ${renderProjectAnswers(c)}
            </dl>
          </section>
        </td>
      `;
      tableBody.appendChild(detailRow);
    }
  });
}

function refresh() {
  carregarAreas();
  updateKpis();
  renderTable();
}

/*
 * Ações do candidato
 * ------------------
 * Criação, edição e exclusão de registros.
 */
// ---------- Candidate actions ----------
function saveCandidate(event) {
  if (event) event.preventDefault();
  hideFeedback();

  [campos.nome, campos.cpf, campos.email, campos.telefone, campos.area, campos.razaoSocial, campos.cnpj].forEach(field => setFieldValidity(field, true));

  const razaoSocial = campos.razaoSocial.value.trim();
  const cnpj = campos.cnpj.value.trim();
  const nome = campos.nome.value.trim();
  const cpf = campos.cpf.value.trim();
  const email = normalizeEmail(campos.email.value);
  const telefone = campos.telefone.value.trim();
  const area = campos.area.value;
  const documentos = getCheckedDocs();

  if (nome.length < 3) {
    return invalidateField(campos.nome, 'Informe o nome completo com pelo menos 3 caracteres.');
  }

  if (!validarCPF(cpf)) {
    return invalidateField(campos.cpf, 'CPF inválido. Revise o número informado.');
  }

  if (!isValidEmail(email)) {
    return invalidateField(campos.email, 'Informe um e-mail válido.');
  }

  if (!isValidPhone(telefone)) {
    return invalidateField(campos.telefone, 'Informe um telefone com DDD válido.');
  }

  if (!area) {
    return invalidateField(campos.area, 'Selecione uma área de interesse para continuar.');
  }

  if (razaoSocial && !cnpj) {
    return invalidateField(campos.cnpj, 'Informe o CNPJ da organização.');
  }

  if (cnpj && !razaoSocial) {
    return invalidateField(campos.razaoSocial, 'Informe a razão social para vincular o CNPJ.');
  }

  if (cnpj && !validarCNPJ(cnpj)) {
    return invalidateField(campos.cnpj, 'CNPJ inválido. Revise o número informado.');
  }

  if (!documentos.length) {
    showFeedback('Selecione pelo menos um documento entregue para iniciar a triagem.', 'error');
    document.querySelector('input[name="docs"]')?.focus();
    return false;
  }

  const cadastroJaExiste = candidatos.some(c =>
    c.nome === nome &&
    c.cpf === cpf &&
    c.email === email &&
    c.id !== campos.id.value
  );

  if (cadastroJaExiste) {
    showFeedback('Já existe um candidato cadastrado com estes dados.', 'error');
    return false;
  }

  const emailJaExiste = candidatos.some(c => c.email === email && c.id !== campos.id.value);
  if (emailJaExiste) {
    return invalidateField(campos.email, 'Já existe um candidato cadastrado com este e-mail.');
  }

  const existingCandidate = candidatos.find(c => c.id === campos.id.value);
  const avaliacao = avaliarDocumentos(documentos);
  const payload = {
    id: campos.id.value || crypto.randomUUID(),
    userId: currentUser.id,
    ownerEmail: currentUser.email,
    candidateAccountUserId: existingCandidate?.candidateAccountUserId || null,
    razaoSocial,
    cnpj,
    nome,
    cpf,
    email,
    telefone,
    area,
    documentos,
    projetoIA: existingCandidate?.projetoIA || getEmptyProjectData(),
    pendencias: avaliacao.pendencias,
    status: avaliacao.status,
    pendenciaCritica: avaliacao.pendenciaCritica
  };

  if (campos.id.value) {
    candidatos = candidatos.map(c => c.id === payload.id ? payload : c);
    showFeedback('Cadastro atualizado com sucesso.', 'success');
  } else {
    candidatos = [payload, ...candidatos];
    showFeedback('Cadastro efetuado com sucesso.', 'success');
  }

  activeCandidateId = payload.id;
  projectCandidateId.value = payload.id;
  persistCandidates();
  const candidatoAtual = candidatos.find(c => c.id === payload.id);
  const projetoEmRascunho = getDraftProjectData(payload.id);
  preencherFormularioProjeto(projetoEmRascunho || candidatoAtual?.projetoIA);
  persistFormDraft({
    activeTab: 'projeto-ia',
    candidateId: payload.id,
    candidateData: payload,
    projectData: projetoEmRascunho || candidatoAtual?.projetoIA || getEmptyProjectData()
  });
  limparFormulario();
  refresh();
  setActiveTab('projeto-ia');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return true;
}

function editCandidate(id) {
  const candidato = candidatos.find(c => c.id === id);
  if (!candidato) return;
  preencherFormularioCandidato(candidato);
  activeCandidateId = candidato.id;
  projectCandidateId.value = candidato.id;
  const projetoEmRascunho = getDraftProjectData(candidato.id);
  preencherFormularioProjeto(projetoEmRascunho || candidato.projetoIA);
  persistFormDraft({
    activeTab: 'cadastro',
    candidateId: candidato.id,
    candidateData: candidato,
    projectData: projetoEmRascunho || candidato.projetoIA
  });
  showFeedback('Você está editando um cadastro existente.', 'success');
  setActiveTab('cadastro');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCandidate(id) {
  const candidato = candidatos.find(c => c.id === id);
  if (!candidato) return;
  const confirmado = confirm(`Deseja excluir o cadastro de ${candidato.nome}?`);
  if (!confirmado) return;
  candidatos = candidatos.filter(c => c.id !== id);
  expandedProjectIds.delete(id);
  if (campos.id.value === id) limparFormulario();
  if (activeCandidateId === id) limparFormularioProjeto(true);
  persistCandidates();
  refresh();
}

function saveProject(event) {
  event.preventDefault();
  hideProjectFeedback();
  Object.values(projectFields).forEach(field => setFieldValidity(field, true));

  const candidateId = projectCandidateId.value || activeCandidateId;
  if (!candidateId) {
    showProjectFeedback('Preencha o Novo cadastro antes de salvar o Projeto de IA.', 'error');
    return;
  }

  const candidato = candidatos.find(item => item.id === candidateId);
  if (!candidato) {
    showProjectFeedback('Não foi possível localizar o candidato vinculado a este projeto.', 'error');
    return;
  }

  const projectData = getProjectData();
  if (projectData.title.length < 5) {
    invalidateField(projectFields.title, 'Informe um título mais descritivo para o projeto de IA.', 'project');
    return;
  }

  if (projectData.benefit.length < 10) {
    invalidateField(projectFields.benefit, 'Descreva os benefícios esperados no Sandbox Regulatório.', 'project');
    return;
  }

  if (projectData.goals.length < 10) {
    invalidateField(projectFields.goals, 'Explique os objetivos do projeto com mais detalhes.', 'project');
    return;
  }

  if (projectData.testPlan.length < 10) {
    invalidateField(projectFields.testPlan, 'Descreva um plano de testes mínimo para o projeto.', 'project');
    return;
  }

  candidatos = candidatos.map(item => (
    item.id === candidateId
      ? { ...item, projetoIA: projectData }
      : item
  ));

  activeCandidateId = candidateId;
  projectCandidateId.value = candidateId;
  persistCandidates();
  const candidatoAtualizado = candidatos.find(item => item.id === candidateId);
  const mensagem = hasSavedProject(candidatoAtualizado)
    ? 'Projeto de IA salvo com sucesso e vinculado ao cadastro.'
    : 'Projeto de IA salvo, mas o cadastro seguirá pendente até o preenchimento completo do formulário.';
  persistFormDraft({
    activeTab: 'lista',
    candidateId,
    candidateData: candidatoAtualizado,
    projectData
  });
  showProjectFeedback(mensagem, 'success');
  refresh();
  setActiveTab('lista');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/*
 * Exportação e dados de exemplo
 * -----------------------------
 * Geração de CSV e carregamento de dados de teste.
 */
function exportCSV() {
  if (!candidatos.length) {
    alert('Cadastre ao menos um candidato antes de exportar.');
    return;
  }
  const headers = [
    'Razão Social',
    'CNPJ',
    'Nome',
    'CPF',
    'E-mail',
    'Telefone',
    'Área',
    'Documentos',
    'Pendências',
    'Status',
    'Projeto IA Salvo',
    ...projectQuestionFields.map(item => item.label)
  ];
  const rows = candidatos.map(c => [
    c.razaoSocial || '',
    c.cnpj || '',
    c.nome,
    c.cpf,
    c.email,
    c.telefone,
    c.area,
    c.documentos.join(' | '),
    getResolvedCandidatePendencias(c).join(' | ') || 'Nenhuma',
    getResolvedCandidateStatus(c),
    hasCandidateProjectResponses(c) ? 'Sim' : 'Não',
    ...projectQuestionFields.map(item => c.projetoIA?.[item.key] || '')
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';'))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'candidatos.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function seedData() {
  if (candidatos.length && !confirm('Isso adicionará exemplos à lista atual. Deseja continuar?')) return;
  const base = [
    {
      razaoSocial: 'Instituto Saber em Rede',
      cnpj: '12.345.678/0001-90',
      nome: 'Ana Beatriz Costa',
      cpf: '529.982.247-25',
      email: 'ana.costa@email.com',
      telefone: '(61) 99111-2233',
      area: 'Apoio Pedagogico Complementar',
      documentos: ['RG', 'CPF', 'Certidao de Regularidade', 'Certidao Negativa', 'Copia de Estatuto', 'Documentacao Legal', 'Descricao da Infraestrutura', 'Descricao da Estrutura de Governança', 'Descricao da Equipe', 'Declaracao de Inexistencia/Conflito de Interesses', 'Plano de Descontinuidade Preliminar', 'Projeto de Solucao de IA', 'Termo de Compromisso'],
      projetoIA: {
        title: 'Tutor Inteligente para Reforco Escolar',
        area: 'Apoio pedagogico complementar',
        benefit: 'Validar a solução em ambiente regulatório controlado e aprimorar a governança do modelo.',
        trl: 'TRL 6',
        components: 'Painel web, motor de recomendação pedagógica e modelo de classificação de desempenho.',
        goals: 'Personalizar trilhas de reforço e reduzir defasagens de aprendizagem.',
        society: 'Aumenta o acesso a apoio educacional com acompanhamento individualizado.',
        risks: 'Risco de viés em recomendações mitigado com revisão pedagógica e auditorias periódicas.',
        data: 'Coleta de históricos escolares anonimizados e registros de atividades em ambiente educacional.',
        personalData: 'Utiliza dados anonimizados para treinamento e dados pessoais mínimos na operação.',
        rights: 'Controle de acesso, registro de consentimento e canal de solicitação do titular.',
        notice: 'Os responsáveis foram informados por termo de consentimento e política de uso de dados.',
        explainability: 'O modelo apresenta justificativas por fatores de desempenho e regras de apoio.',
        metrics: 'Acurácia de 0,89 e F1-score de 0,86 em validação.',
        biasMitigation: 'Balanceamento de base e análise por grupos demográficos.',
        biasEvaluation: 'Monitoramento periódico de disparidades e testes comparativos por segmento.',
        testPlan: 'Testes piloto com escolas parceiras, avaliação quinzenal e revisão com equipe pedagógica.'
      }
    },
    {
      razaoSocial: 'Centro Inova Educação Ltda',
      cnpj: '23.456.789/0001-11',
      nome: 'Lucas Almeida Rocha',
      cpf: '111.444.777-35',
      email: 'lucas.rocha@email.com',
      telefone: '(61) 98888-4455',
      area: 'Gestao Educacional',
      documentos: ['RG', 'CPF', 'Certidao de Regularidade', 'Certidao Negativa', 'Copia de Estatuto', 'Documentacao Legal', 'Descricao da Infraestrutura', 'Descricao da Estrutura de Governança', 'Descricao da Equipe', 'Declaracao de Inexistencia/Conflito de Interesses', 'Plano de Descontinuidade Preliminar', 'Projeto de Solucao de IA'],
      projetoIA: {
        title: '',
        area: '',
        benefit: '',
        trl: '',
        components: '',
        goals: '',
        society: '',
        risks: '',
        data: '',
        personalData: '',
        rights: '',
        notice: '',
        explainability: '',
        metrics: '',
        biasMitigation: '',
        biasEvaluation: '',
        testPlan: ''
      }
    },
    {
      razaoSocial: 'Fundação Horizonte Digital',
      cnpj: '34.567.890/0001-22',
      nome: 'Mariana Fernandes',
      cpf: '935.411.347-80',
      email: 'mariana.fernandes@email.com',
      telefone: '(61) 99777-1122',
      area: 'Reducao de Desigualdades',
      documentos: ['RG', 'CPF', 'Certidao de Regularidade', 'Certidao Negativa', 'Documentacao Legal', 'Descricao da Infraestrutura', 'Descricao da Estrutura de Governança', 'Descricao da Equipe', 'Declaracao de Inexistencia/Conflito de Interesses', 'Plano de Descontinuidade Preliminar', 'Projeto de Solucao de IA', 'Termo de Compromisso']
    }
  ];
  const exemplos = base.map(item => {
    return normalizeCandidate({
      id: crypto.randomUUID(),
      ...item
    });
  });
  candidatos = [...exemplos, ...candidatos];
  persistCandidates();
  refresh();
}

/*
 * Listeners de evento
 * -------------------
 * Interações do usuário no formulário e painel.
 */
// ---------- Event listeners ----------
campos.cpf.addEventListener('input', e => { e.target.value = formatCPF(e.target.value); setFieldValidity(e.target, true); });
campos.cnpj.addEventListener('input', e => { e.target.value = formatCNPJ(e.target.value); setFieldValidity(e.target, true); });
campos.telefone.addEventListener('input', e => { e.target.value = formatPhone(e.target.value); setFieldValidity(e.target, true); });
[...Object.values(campos), ...Object.values(projectFields)].forEach(field => {
  field?.addEventListener('input', () => {
    setFieldValidity(field, true);
    persistFormDraft();
  });
  field?.addEventListener('change', () => {
    setFieldValidity(field, true);
    persistFormDraft();
  });
});
document.querySelectorAll('input[name="docs"]').forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    hideFeedback();
    persistFormDraft();
  });
});
form.addEventListener('submit', saveCandidate);
projectForm.addEventListener('submit', saveProject);
clearBtn.addEventListener('click', () => {
  limparFormulario(true);
  limparFormularioProjeto(true);
});
backToCadastroBtn.addEventListener('click', () => {
  persistFormDraft({ activeTab: 'cadastro' });
  const candidatoAtual = candidatos.find(c => c.id === (projectCandidateId.value || activeCandidateId));
  if (candidatoAtual) {
    preencherFormularioCandidato(candidatoAtual);
  }
  setActiveTab('cadastro');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
exportBtn.addEventListener('click', exportCSV);
seedDataBtn.addEventListener('click', seedData);
clearDataBtn.addEventListener('click', () => {
  if (!candidatos.length) return;
  const confirmado = confirm('Deseja excluir todos os cadastros?');
  if (!confirmado) return;
  candidatos = [];
  expandedProjectIds = new Set();
  limparFormulario();
  limparFormularioProjeto(true);
  persistCandidates();
  refresh();
});

logoutBtn.addEventListener('click', () => {
  logoutUser();
  window.location.href = 'login.html';
});

selectAllDocsBtn.addEventListener('click', () => {
  document.querySelectorAll('input[name="docs"]').forEach(checkbox => {
    checkbox.checked = true;
  });
  persistFormDraft();
});

deselectAllDocsBtn.addEventListener('click', () => {
  document.querySelectorAll('input[name="docs"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  persistFormDraft();
});

[searchInput, statusFilter, areaFilter, pendenciaFilter].forEach(item => item.addEventListener('input', renderTable));

document.querySelectorAll('[data-sort]').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.sort;
    if (sortState.key === key) {
      sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
      sortState = { key, direction: 'asc' };
    }
    renderTable();
  });
});

tableBody.addEventListener('click', event => {
  const editId = event.target.getAttribute('data-edit');
  const projectId = event.target.getAttribute('data-toggle-project');
  const deleteId = event.target.getAttribute('data-delete');
  if (editId) editCandidate(editId);
  if (projectId) {
    if (expandedProjectIds.has(projectId)) {
      expandedProjectIds.delete(projectId);
    } else {
      expandedProjectIds.add(projectId);
    }
    renderTable();
  }
  if (deleteId) deleteCandidate(deleteId);
});

function setActiveTab(tab, persist = true) {
  tabButtons.forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  tabPanels.forEach(panel => {
    panel.style.display = panel.dataset.panel === tab ? '' : 'none';
  });

  if (persist) {
    persistDraftTab(tab);
  }
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
});

if (currentUser) {
  loadCandidates();
  setActiveTab('dashboard', false);
  refresh();
  restoreFormDraft();

  // Mostrar informações do usuário
  userInfoEl.innerHTML = `👤 ${escapeHTML(currentUser.name)} <a href="login.html" style="color: var(--color-primary); text-decoration: none;">Ver progresso</a>`;

  window.addEventListener('beforeunload', () => {
    persistFormDraft();
  });

  // Sincronizar em tempo real com a página de login
  window.addEventListener('storage', () => {
    loadCandidates();
    refresh();
    restoreFormDraft();
  });
}

