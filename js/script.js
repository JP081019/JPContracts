// ============================================
// JP Contracts | JP Dev Soluções Digitais
// script.js — lógica principal
// ============================================

// ---- NAVBAR SCROLL ----
function initNavbar() {
  var navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', function() {
    if (window.scrollY > 20) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  });
}

// ---- MOBILE MENU ----
function initMobileMenu() {
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;
  hamburger.addEventListener('click', function() {
    navLinks.classList.toggle('mobile-open');
  });
  navLinks.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() { navLinks.classList.remove('mobile-open'); });
  });
}

// ---- SCROLL REVEAL ----
function initScrollReveal() {
  var elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  elements.forEach(function(el) { observer.observe(el); });
}

// ---- COUNTER ANIMATION ----
function animateCounter(el, target, duration) {
  duration = duration || 1200;
  var start = 0;
  var step = target / (duration / 16);
  function tick() {
    start += step;
    if (start < target) {
      el.textContent = Math.floor(start).toLocaleString('pt-BR');
      requestAnimationFrame(tick);
    } else {
      el.textContent = target.toLocaleString('pt-BR');
    }
  }
  requestAnimationFrame(tick);
}

function initCounters() {
  var counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target, parseInt(entry.target.dataset.counter));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(function(el) { observer.observe(el); });
}

// ---- AUTH GUARD ----
function authGuard() {
  var user = sessionStorage.getItem('jpdev_user');
  if (!user) { window.location.href = 'login.html'; return null; }
  return JSON.parse(user);
}

// ---- CONTRACT STORE ----
var ContractStore = {
  KEY: 'jpdev_contracts',

  getAll: function() {
    var data = localStorage.getItem(this.KEY);
    return data ? JSON.parse(data) : this.getDefaults();
  },

  save: function(contracts) {
    localStorage.setItem(this.KEY, JSON.stringify(contracts));
  },

  add: function(contract) {
    var contracts = this.getAll();
    contract.id = Date.now();
    contract.createdAt = new Date().toISOString();
    contracts.unshift(contract);
    this.save(contracts);
    return contract;
  },

  remove: function(id) {
    var contracts = this.getAll().filter(function(c) { return c.id !== id; });
    this.save(contracts);
  },

  getDefaults: function() {
    var today = new Date();
    function addDays(d, n) {
      var r = new Date(d);
      r.setDate(r.getDate() + n);
      return r.toISOString().split('T')[0];
    }
    var defaults = [
      { id:1, name:'Contrato de Serviços TI',   company:'TechCorp Ltda.',       value:8500,  startDate:addDays(today,-120), endDate:addDays(today,45),  description:'Suporte e manutenção de sistemas',        category:'servicos',      createdAt:addDays(today,-120) },
      { id:2, name:'Licença de Software ERP',    company:'Grupo Sigma S.A.',     value:24000, startDate:addDays(today,-200), endDate:addDays(today,165), description:'Licença anual sistema ERP',               category:'licenca',       createdAt:addDays(today,-200) },
      { id:3, name:'Consultoria Estratégica',    company:'Inovare Consultores',  value:5200,  startDate:addDays(today,-30),  endDate:addDays(today,7),   description:'Projeto de transformação digital',        category:'consultoria',   createdAt:addDays(today,-30)  },
      { id:4, name:'Desenvolvimento Web',        company:'StartUp Nexus',        value:12800, startDate:addDays(today,-90),  endDate:addDays(today,-5),  description:'Desenvolvimento plataforma e-commerce',   category:'desenvolvimento',createdAt:addDays(today,-90)  },
      { id:5, name:'Suporte Infraestrutura',     company:'Mega Corp Brasil',     value:3600,  startDate:addDays(today,-60),  endDate:addDays(today,12),  description:'Suporte mensal infraestrutura cloud',     category:'servicos',      createdAt:addDays(today,-60)  }
    ];
    this.save(defaults);
    return defaults;
  }
};

// ---- STATUS CALCULATION ----
function getContractStatus(endDate) {
  var now = new Date();
  var end = new Date(endDate);
  var diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)  return { label:'Vencido',   class:'badge-danger',  dot:'dot-danger',  days:diffDays };
  if (diffDays <= 15) return { label:'Vencendo',  class:'badge-warning', dot:'dot-warning', days:diffDays };
  return                     { label:'Ativo',     class:'badge-success', dot:'dot-success', days:diffDays };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  var parts = dateStr.split('-');
  return parts[2] + '/' + parts[1] + '/' + parts[0];
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(value || 0);
}

// ---- DASHBOARD INIT ----
function initDashboard() {
  var user = authGuard();
  if (!user) return;

  var userName = document.querySelector('.user-name');
  if (userName) userName.textContent = user.name || 'Usuário';

  renderDashboard();

  // Logout
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', function() {
    sessionStorage.removeItem('jpdev_user');
    window.location.href = 'login.html';
  });

  // Add contract modal
  initAddContractModal();
}

function renderDashboard() {
  var contracts = ContractStore.getAll();
  updateStats(contracts);
  renderContractsList();
  renderAlerts(contracts);
}

function updateStats(contracts) {
  var total    = contracts.length;
  var active   = contracts.filter(function(c) { return getContractStatus(c.endDate).label === 'Ativo'; }).length;
  var expiring = contracts.filter(function(c) { return getContractStatus(c.endDate).label === 'Vencendo'; }).length;
  var expired  = contracts.filter(function(c) { return getContractStatus(c.endDate).label === 'Vencido'; }).length;
  var totalVal = contracts.reduce(function(s,c) { return s + (parseFloat(c.value)||0); }, 0);

  function set(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }
  set('stat-total',    total);
  set('stat-active',   active);
  set('stat-expiring', expiring);
  set('stat-expired',  expired);
  set('stat-value',    formatCurrency(totalVal));
}

function renderContractsList(search) {
  var contracts = ContractStore.getAll();
  var filtered = search
    ? contracts.filter(function(c) {
        return c.name.toLowerCase().includes(search.toLowerCase()) ||
               c.company.toLowerCase().includes(search.toLowerCase());
      })
    : contracts;

  var tbody = document.getElementById('contractsTableBody');
  if (!tbody) return;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📋</div><div class="empty-title">' + (search ? 'Nenhum contrato encontrado' : 'Nenhum contrato cadastrado') + '</div><div class="empty-desc">' + (search ? 'Tente outros termos' : 'Adicione seu primeiro contrato clicando em "+ Novo contrato"') + '</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(c) {
    var s = getContractStatus(c.endDate);
    var daysText = s.days < 0 ? 'Vencido há ' + Math.abs(s.days) + ' dias' : 'Vence em ' + s.days + ' dias';
    return '<tr>' +
      '<td><div style="font-weight:600;">' + c.name + '</div></td>' +
      '<td><div style="color:var(--gray-text);font-size:.82rem;">' + c.company + '</div></td>' +
      '<td>' + formatDate(c.endDate) + '</td>' +
      '<td><span class="badge ' + s.class + '"><span class="status-dot ' + s.dot + '"></span>' + s.label + '</span><div style="font-size:.72rem;color:var(--gray-text);margin-top:3px;">' + daysText + '</div></td>' +
      '<td style="font-weight:600;">' + formatCurrency(c.value) + '</td>' +
      '<td><div class="table-actions"><button class="btn btn-sm btn-secondary" onclick="viewContract(' + c.id + ')">👁 Ver</button><button class="btn btn-sm btn-danger" onclick="deleteContract(' + c.id + ')">🗑</button></div></td>' +
      '</tr>';
  }).join('');
}

function renderAlerts(contracts) {
  var container = document.getElementById('alertsContainer');
  if (!container) return;
  var urgent = contracts.filter(function(c) {
    var s = getContractStatus(c.endDate);
    return s.label === 'Vencendo' || s.label === 'Vencido';
  }).slice(0, 4);

  if (!urgent.length) {
    container.innerHTML = '<div class="alert alert-success"><span>✅</span><span>Todos os contratos estão dentro do prazo. Parabéns!</span></div>';
    return;
  }
  container.innerHTML = urgent.map(function(c) {
    var s = getContractStatus(c.endDate);
    var isExp = s.label === 'Vencido';
    return '<div class="alert ' + (isExp ? 'alert-danger' : 'alert-warning') + '"><span>' + (isExp ? '🔴' : '🟡') + '</span><span><strong>' + c.name + '</strong> — ' + c.company + ' · ' + (isExp ? 'Vencido há ' + Math.abs(s.days) + ' dias' : 'Vence em ' + s.days + ' dias') + '</span></div>';
  }).join('');
}

// ---- ADD CONTRACT MODAL ----
function initAddContractModal() {
  var overlay = document.getElementById('addContractModal');
  var form    = document.getElementById('addContractForm');
  if (!overlay || !form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var fd = new FormData(form);
    ContractStore.add({
      name:        fd.get('name'),
      company:     fd.get('company'),
      value:       parseFloat(fd.get('value')) || 0,
      startDate:   fd.get('startDate'),
      endDate:     fd.get('endDate'),
      description: fd.get('description') || '',
      category:    fd.get('category') || 'outros'
    });
    overlay.classList.remove('open');
    form.reset();
    renderDashboard();
    showToast('✅ Contrato adicionado com sucesso!');
  });
}

// ---- VIEW / DELETE ----
function viewContract(id) {
  var contract = ContractStore.getAll().find(function(c) { return c.id === id; });
  if (!contract) return;
  var s = getContractStatus(contract.endDate);
  var overlay = document.getElementById('viewContractModal');
  var content = document.getElementById('viewContractContent');
  if (!overlay || !content) return;

  content.innerHTML =
    '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;">' +
        '<h3 style="font-size:1.1rem;">' + contract.name + '</h3>' +
        '<span class="badge ' + s.class + '"><span class="status-dot ' + s.dot + '"></span>' + s.label + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
        '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Empresa</div><div style="font-weight:600;">' + contract.company + '</div></div>' +
        '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Valor</div><div style="font-weight:700;color:var(--blue);font-size:1.1rem;">' + formatCurrency(contract.value) + '</div></div>' +
        '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Início</div><div>' + formatDate(contract.startDate) + '</div></div>' +
        '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Vencimento</div><div style="font-weight:600;">' + formatDate(contract.endDate) + '</div></div>' +
        (contract.category ? '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Categoria</div><div style="text-transform:capitalize;">' + contract.category + '</div></div>' : '') +
      '</div>' +
      (contract.description ? '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Descrição</div><div style="font-size:.9rem;color:var(--black-soft);line-height:1.65;padding:12px;background:var(--gray-light);border-radius:8px;">' + contract.description + '</div></div>' : '') +
      '<div style="display:flex;gap:10px;padding-top:8px;border-top:1px solid var(--gray-mid);">' +
        '<button class="btn btn-danger btn-sm" onclick="deleteContract(' + contract.id + ');closeViewModal();">🗑 Excluir</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="closeViewModal()">Fechar</button>' +
      '</div>' +
    '</div>';

  overlay.classList.add('open');
}

function deleteContract(id) {
  if (!confirm('Tem certeza que deseja excluir este contrato?')) return;
  ContractStore.remove(id);
  renderDashboard();
  showToast('🗑 Contrato removido.');
}

function closeViewModal() {
  var overlay = document.getElementById('viewContractModal');
  if (overlay) overlay.classList.remove('open');
}

// ---- TOAST NOTIFICATION ----
function showToast(message) {
  var old = document.querySelector('.toast-notification');
  if (old) old.remove();

  var toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = message;
  toast.style.cssText = 'position:fixed;bottom:28px;right:28px;background:var(--black);color:white;padding:14px 20px;border-radius:12px;font-size:.88rem;font-weight:500;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.25);display:flex;align-items:center;gap:8px;max-width:320px;animation:toastIn .3s ease;';

  if (!document.getElementById('toastStyle')) {
    var s = document.createElement('style');
    s.id = 'toastStyle';
    s.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(s);
  }

  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; setTimeout(function() { toast.remove(); }, 400); }, 2800);
}

// ---- INIT ALL ----
document.addEventListener('DOMContentLoaded', function() {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initCounters();

  if (document.querySelector('.dashboard-layout')) initDashboard();

  // Smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior:'smooth', block:'start' }); }
    });
  });
});