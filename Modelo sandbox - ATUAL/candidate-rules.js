const CANDIDATE_STORAGE_KEY = 'modelo-sandbox-candidatos-v1';

const CANDIDATE_RULES = Object.freeze({
  docsObrigatorios: [
    'RG',
    'Certidao de Regularidade',
    'Certidao Negativa',
    'Copia de Estatuto',
    'Documentacao Legal',
    'Descricao da Infraestrutura',
    'Descricao da Estrutura de Governança',
    'Descricao da Equipe',
    'Declaracao de Inexistencia/Conflito de Interesses',
    'Plano de Descontinuidade Preliminar',
    'Projeto de Solucao de IA',
    'Termo de Compromisso'
  ],
  projectFieldKeys: [
    'title',
    'benefit',
    'trl',
    'components',
    'goals',
    'society',
    'risks',
    'data',
    'personalData',
    'rights',
    'notice',
    'explainability',
    'metrics',
    'biasMitigation',
    'biasEvaluation',
    'testPlan'
  ]
});

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getAllStoredCandidates() {
  try {
    const raw = localStorage.getItem(CANDIDATE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Nao foi possivel ler os candidatos salvos.', error);
    return [];
  }
}

function saveAllStoredCandidates(candidates) {
  localStorage.setItem(CANDIDATE_STORAGE_KEY, JSON.stringify(candidates));
}

function hasProjectResponses(candidato) {
  return CANDIDATE_RULES.projectFieldKeys.some(field => String(candidato?.projetoIA?.[field] || '').trim());
}

function isProjectComplete(candidato) {
  return CANDIDATE_RULES.projectFieldKeys.every(field => String(candidato?.projetoIA?.[field] || '').trim());
}

function getDocumentPendencias(candidato) {
  const documentos = Array.isArray(candidato?.documentos) ? candidato.documentos : [];
  return CANDIDATE_RULES.docsObrigatorios.filter(doc => !documentos.includes(doc));
}

function getCandidatePendencias(candidato) {
  const pendencias = getDocumentPendencias(candidato);

  if (!hasProjectResponses(candidato)) {
    pendencias.push('Projeto de IA pendente');
  } else if (!isProjectComplete(candidato)) {
    pendencias.push('Projeto de IA incompleto');
  }

  return pendencias;
}

function getCandidateStatus(candidato) {
  return getCandidatePendencias(candidato).length === 0 ? 'Apto' : 'Pendente';
}

function isCandidateCritical(candidato) {
  const pendenciasDocumentais = getDocumentPendencias(candidato);
  return pendenciasDocumentais.includes('RG');
}

function getCandidateByAccountUserId(userId) {
  return getAllStoredCandidates().find(candidate => candidate.candidateAccountUserId === userId) || null;
}

function linkCandidateToUser(user) {
  if (!user || user.role !== 'candidato') return null;

  const candidates = getAllStoredCandidates();
  const existingLinkedCandidate = candidates.find(candidate => candidate.candidateAccountUserId === user.id);
  if (existingLinkedCandidate) return existingLinkedCandidate;

  const userEmail = normalizeEmail(user.email);
  if (!userEmail) return null;

  let linkedCandidate = null;
  const updatedCandidates = candidates.map(candidate => {
    const candidateEmail = normalizeEmail(candidate.email);
    const canLink = candidateEmail === userEmail && (!candidate.candidateAccountUserId || candidate.candidateAccountUserId === user.id);

    if (!canLink || linkedCandidate) {
      return candidate;
    }

    linkedCandidate = {
      ...candidate,
      candidateAccountUserId: user.id
    };

    return linkedCandidate;
  });

  if (linkedCandidate) {
    saveAllStoredCandidates(updatedCandidates);
  }

  return linkedCandidate;
}

window.CANDIDATE_STORAGE_KEY = CANDIDATE_STORAGE_KEY;
window.CANDIDATE_RULES = CANDIDATE_RULES;
window.normalizeEmail = normalizeEmail;
window.getAllStoredCandidates = getAllStoredCandidates;
window.saveAllStoredCandidates = saveAllStoredCandidates;
window.hasProjectResponses = hasProjectResponses;
window.isProjectComplete = isProjectComplete;
window.getDocumentPendencias = getDocumentPendencias;
window.getCandidatePendencias = getCandidatePendencias;
window.getCandidateStatus = getCandidateStatus;
window.isCandidateCritical = isCandidateCritical;
window.getCandidateByAccountUserId = getCandidateByAccountUserId;
window.linkCandidateToUser = linkCandidateToUser;
