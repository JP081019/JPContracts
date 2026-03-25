// ============================================
// JP Contracts | JP Dev Soluções Digitais
// script.js — lógica principal
// ============================================

// 🔗 SUPABASE
const supabase = window.supabase.createClient(
  'https://gvnfvmzlcqwoxzzhgebs.supabase.co',
  'sb_publishable_PT5_hWeX7d3kQ8vYM7-44A_gYwHGph-'
);

// ---- NAVBAR SCROLL ----
function initNavbar() {
  if (!window.supabaseClient) {
  window.supabaseClient = window.supabase.createClient(
    'https://gvnfvmzlcqwoxzzhgebs.supabase.co',
    'sb_publishable_PT5_hWeX7d3kQ8vYM7-44A_gYwHGph-'
  );
}

const supabase = window.supabaseClient;
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
    a.addEventListener('click', function() {
      navLinks.classList.remove('mobile-open');
    });
  });
}

// ---- AUTH GUARD (NOVO - SUPABASE) ----
async function authGuard() {
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    window.location.href = 'login.html';
    return null;
  }

  return data.user;
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

// ---- AUTH GUARD (NOVO - SUPABASE) ----
async function authGuard() {
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    window.location.href = 'login.html';
    return null;
  }

  return data.user;
}

// ---- CONTRACT STORE (AINDA LOCAL - TEMPORÁRIO) ----
var ContractStore = {
  KEY: 'jpdev_contracts',

  getAll: function() {
    var data = localStorage.getItem(this.KEY);
    return data ? JSON.parse(data) : [];
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
    var contracts = this.getAll().filter(function(c) {
      return c.id !== id;
    });
    this.save(contracts);
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
async function initDashboard() {
  const user = await authGuard();
  if (!user) return;

  var userName = document.querySelector('.user-name');
  if (userName) userName.textContent = user.email;

  renderDashboard();

  // Logout REAL
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });
  }

  initAddContractModal();
}

// ---- RENDER ----
function renderDashboard() {
  var contracts = ContractStore.getAll();
  renderContractsList(contracts);
}

// ---- LISTA ----
function renderContractsList(contracts) {
  var tbody = document.getElementById('contractsTableBody');
  if (!tbody) return;

  if (!contracts.length) {
    tbody.innerHTML = '<tr><td colspan="6">Nenhum contrato</td></tr>';
    return;
  }

  tbody.innerHTML = contracts.map(function(c) {
    return `
      <tr>
        <td>${c.name}</td>
        <td>${c.company}</td>
        <td>${c.endDate}</td>
        <td>${c.value}</td>
        <td>
          <button onclick="deleteContract(${c.id})">Excluir</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ---- ADD ----
function initAddContractModal() {
  var form = document.getElementById('addContractForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var fd = new FormData(form);

    ContractStore.add({
      name: fd.get('name'),
      company: fd.get('company'),
      value: fd.get('value'),
      endDate: fd.get('endDate')
    });

    form.reset();
    renderDashboard();
  });
}

// ---- DELETE ----
function deleteContract(id) {
  ContractStore.remove(id);
  renderDashboard();
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', function() {
  initNavbar();
  initMobileMenu();

  if (document.querySelector('.dashboard-layout')) {
    initDashboard();
  }
});

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