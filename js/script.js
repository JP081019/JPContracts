// ============================================================
// JP Contracts | JP Dev Soluções Digitais
// script.js — versão unificada
// ============================================================

// ============================================================
// 1. SUPABASE
// ============================================================
window.supabaseClient = window.supabase.createClient(
  'https://gvnfvmzlcqwoxzzhgebs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bmZ2bXpsY3F3b3h6emhnZWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTIzNjYsImV4cCI6MjA4OTk4ODM2Nn0.KIOn1nFXeMhHHTDPfILPJuBHA8iKsZrBog6oz7PCyEs'
)

// ============================================================
// 2. UI / ANIMAÇÕES
// ============================================================
function initNavbar() {
  var navbar = document.getElementById('navbar')
  if (!navbar) return
  window.addEventListener('scroll', function () {
    if (window.scrollY > 20) navbar.classList.add('scrolled')
    else navbar.classList.remove('scrolled')
  })
}

function initMobileMenu() {
  var hamburger = document.getElementById('hamburger')
  var navLinks  = document.getElementById('navLinks')
  if (!hamburger || !navLinks) return
  hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('mobile-open')
  })
  navLinks.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      navLinks.classList.remove('mobile-open')
    })
  })
}

function initScrollReveal() {
  var elements = document.querySelectorAll('.reveal')
  if (!elements.length) return
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.12 })
  elements.forEach(function (el) { observer.observe(el) })
}

function animateCounter(el, target, duration) {
  duration = duration || 1200
  var start = 0
  var step  = target / (duration / 16)
  function tick() {
    start += step
    if (start < target) {
      el.textContent = Math.floor(start).toLocaleString('pt-BR')
      requestAnimationFrame(tick)
    } else {
      el.textContent = target.toLocaleString('pt-BR')
    }
  }
  requestAnimationFrame(tick)
}

function initCounters() {
  var counters = document.querySelectorAll('[data-counter]')
  if (!counters.length) return
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target, parseInt(entry.target.dataset.counter))
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.5 })
  counters.forEach(function (el) { observer.observe(el) })
}

// ============================================================
// 3. UTILITÁRIOS
// ============================================================
function getContractStatus(endDate) {
  var now      = new Date()
  var end      = new Date(endDate)
  var diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  if (diffDays < 0)   return { label: 'Vencido',  class: 'badge-danger',  dot: 'dot-danger',  days: diffDays }
  if (diffDays <= 15) return { label: 'Vencendo', class: 'badge-warning', dot: 'dot-warning', days: diffDays }
  return                     { label: 'Ativo',    class: 'badge-success', dot: 'dot-success', days: diffDays }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  var parts = dateStr.split('-')
  return parts[2] + '/' + parts[1] + '/' + parts[0]
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

// ============================================================
// 4. CONTRACT STORE — Supabase
// ============================================================
var ContractStore = {

  // Busca todos os contratos da empresa do usuário logado
  getAll: async function () {
    var result = await window.supabaseClient
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (result.error) {
      console.error('Erro ao buscar contratos:', result.error.message)
      return []
    }

    return result.data
  },

  // Adiciona um novo contrato
  add: async function (contract) {
    // Busca o company_id do usuário logado
    var userResult = await window.supabaseClient
      .from('users')
      .select('company_id')
      .eq('id', (await window.supabaseClient.auth.getUser()).data.user.id)
      .single()

    if (userResult.error) {
      console.error('Erro ao buscar empresa:', userResult.error.message)
      return null
    }

    var result = await window.supabaseClient
      .from('contracts')
      .insert({
        company_id:   userResult.data.company_id,
        name:         contract.name,
        company_name: contract.company,
        value:        contract.value,
        start_date:   contract.startDate,
        end_date:     contract.endDate,
        description:  contract.description,
        category:     contract.category,
        status:       'active'
      })
      .select()
      .single()

    if (result.error) {
      console.error('Erro ao salvar contrato:', result.error.message)
      return null
    }

    return result.data
  },

  // Remove um contrato
  remove: async function (id) {
    var result = await window.supabaseClient
      .from('contracts')
      .delete()
      .eq('id', id)

    if (result.error) {
      console.error('Erro ao remover contrato:', result.error.message)
      return false
    }

    return true
  }
}

// ============================================================
// 5. AUTH
// ============================================================
async function authGuard() {
  var result = await window.supabaseClient.auth.getUser()
  if (!result.data.user) {
    window.location.href = 'login.html'
    return null
  }
  return result.data.user
}

// ============================================================
// 6. DASHBOARD
// ============================================================
async function initDashboard() {
  var user = await authGuard()
  if (!user) return

  var userName = document.querySelector('.user-name')
  if (userName) {
    userName.textContent = (user.user_metadata && user.user_metadata.name)
      ? user.user_metadata.name
      : user.email
  }

  await renderDashboard()

  var logoutBtn = document.getElementById('logoutBtn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      await window.supabaseClient.auth.signOut()
      window.location.href = 'login.html'
    })
  }

  var topbarLogout = document.getElementById('topbarLogout')
  if (topbarLogout) {
    topbarLogout.addEventListener('click', async function () {
      await window.supabaseClient.auth.signOut()
      window.location.href = 'login.html'
    })
  }

  initAddContractModal()
}

async function renderDashboard() {
  var contracts = await ContractStore.getAll()
  updateStats(contracts)
  await renderContractsList()
  renderAlerts(contracts)
}

async function renderContractsList(search) {
  var contracts = await ContractStore.getAll()
  var filtered  = search
    ? contracts.filter(function (c) {
        return c.name.toLowerCase().includes(search.toLowerCase()) ||
               c.company_name.toLowerCase().includes(search.toLowerCase())
      })
    : contracts

  var tbody = document.getElementById('contractsTableBody')
  if (!tbody) return

  if (!filtered.length) {
    tbody.innerHTML =
      '<tr><td colspan="6">' +
        '<div class="empty-state">' +
          '<div class="empty-icon">📋</div>' +
          '<div class="empty-title">Nenhum contrato cadastrado</div>' +
          '<div class="empty-desc">Adicione seu primeiro contrato clicando em "+ Novo contrato"</div>' +
        '</div>' +
      '</td></tr>'
    return
  }

  tbody.innerHTML = filtered.map(function (c) {
    var s        = getContractStatus(c.end_date)
    var daysText = s.days < 0
      ? 'Vencido há ' + Math.abs(s.days) + ' dias'
      : 'Vence em '   + s.days           + ' dias'
    return '<tr>' +
      '<td><div style="font-weight:600;">' + c.name + '</div></td>' +
      '<td><div style="color:var(--gray-text);font-size:.82rem;">' + c.company_name + '</div></td>' +
      '<td>' + formatDate(c.end_date) + '</td>' +
      '<td><span class="badge ' + s.class + '"><span class="status-dot ' + s.dot + '"></span>' + s.label + '</span>' +
        '<div style="font-size:.72rem;color:var(--gray-text);margin-top:3px;">' + daysText + '</div></td>' +
      '<td style="font-weight:600;">' + formatCurrency(c.value) + '</td>' +
      '<td><div class="table-actions">' +
        '<button class="btn btn-sm btn-secondary" onclick="viewContract(\'' + c.id + '\')">👁 Ver</button>' +
        '<button class="btn btn-sm btn-danger" onclick="deleteContract(\'' + c.id + '\')">🗑</button>' +
      '</div></td>' +
    '</tr>'
  }).join('')
}

function renderAlerts(contracts) {
  var container = document.getElementById('alertsContainer')
  if (!container) return

  var urgent = contracts.filter(function (c) {
    var s = getContractStatus(c.end_date)
    return s.label === 'Vencendo' || s.label === 'Vencido'
  }).slice(0, 4)

  if (!urgent.length) {
    container.innerHTML = '<div class="alert alert-success"><span>✅</span><span>Todos os contratos estão dentro do prazo. Parabéns!</span></div>'
    return
  }

  container.innerHTML = urgent.map(function (c) {
    var s     = getContractStatus(c.end_date)
    var isExp = s.label === 'Vencido'
    return '<div class="alert ' + (isExp ? 'alert-danger' : 'alert-warning') + '">' +
      '<span>' + (isExp ? '🔴' : '🟡') + '</span>' +
      '<span><strong>' + c.name + '</strong> — ' + c.company_name + ' · ' +
      (isExp ? 'Vencido há ' + Math.abs(s.days) + ' dias' : 'Vence em ' + s.days + ' dias') +
      '</span></div>'
  }).join('')
}

// ============================================================
// 7. MODAIS
// ============================================================
function initAddContractModal() {
  var overlay = document.getElementById('addContractModal')
  var form    = document.getElementById('addContractForm')
  if (!overlay || !form) return

  form.addEventListener('submit', async function (e) {
    e.preventDefault()
    var fd = new FormData(form)

    var result = await ContractStore.add({
      name:        fd.get('name'),
      company:     fd.get('company'),
      value:       parseFloat(fd.get('value')) || 0,
      startDate:   fd.get('startDate'),
      endDate:     fd.get('endDate'),
      description: fd.get('description') || '',
      category:    fd.get('category')    || 'outros'
    })

    if (!result) {
      showToast('❌ Erro ao salvar contrato.')
      return
    }

    overlay.classList.remove('open')
    form.reset()
    await renderDashboard()
    showToast('✅ Contrato adicionado com sucesso!')
  })
}

async function viewContract(id) {
  var contracts = await ContractStore.getAll()
  var contract  = contracts.find(function (c) { return c.id === id })
  if (!contract) return

  var s       = getContractStatus(contract.end_date)
  var overlay = document.getElementById('viewContractModal')
  var content = document.getElementById('viewContractContent')
  if (!overlay || !content) return

  content.innerHTML =
    '<div style="display:flex;flex-direction:column;gap:16px;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;">' +
        '<h3 style="font-size:1.1rem;">' + contract.name + '</h3>' +
        '<span class="badge ' + s.class + '"><span class="status-dot ' + s.dot + '"></span>' + s.label + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">' +
        '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Empresa</div><div style="font-weight:600;">' + contract.company_name + '</div></div>' +
        '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Valor</div><div style="font-weight:700;color:var(--blue);font-size:1.1rem;">' + formatCurrency(contract.value) + '</div></div>' +
        '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Início</div><div>' + formatDate(contract.start_date) + '</div></div>' +
        '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Vencimento</div><div style="font-weight:600;">' + formatDate(contract.end_date) + '</div></div>' +
        (contract.category ? '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;">Categoria</div><div style="text-transform:capitalize;">' + contract.category + '</div></div>' : '') +
      '</div>' +
      (contract.description ? '<div><div style="font-size:.75rem;color:var(--gray-text);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Descrição</div><div style="font-size:.9rem;color:var(--black-soft);line-height:1.65;padding:12px;background:var(--gray-light);border-radius:8px;">' + contract.description + '</div></div>' : '') +
      '<div style="display:flex;gap:10px;padding-top:8px;border-top:1px solid var(--gray-mid);">' +
        '<button class="btn btn-danger btn-sm" onclick="deleteContract(\'' + contract.id + '\');closeViewModal();">🗑 Excluir</button>' +
        '<button class="btn btn-secondary btn-sm" onclick="closeViewModal()">Fechar</button>' +
      '</div>' +
    '</div>'

  overlay.classList.add('open')
}

async function deleteContract(id) {
  if (!confirm('Tem certeza que deseja excluir este contrato?')) return
  await ContractStore.remove(id)
  await renderDashboard()
  showToast('🗑 Contrato removido.')
}

// ============================================================
// 8. TOAST
// ============================================================
function showToast(message) {
  var old = document.querySelector('.toast-notification')
  if (old) old.remove()

  var toast       = document.createElement('div')
  toast.className = 'toast-notification'
  toast.innerHTML = message
  toast.style.cssText =
    'position:fixed;bottom:28px;right:28px;background:var(--black);color:white;' +
    'padding:14px 20px;border-radius:12px;font-size:.88rem;font-weight:500;z-index:9999;' +
    'box-shadow:0 8px 30px rgba(0,0,0,.25);display:flex;align-items:center;gap:8px;' +
    'max-width:320px;animation:toastIn .3s ease;'

  if (!document.getElementById('toastStyle')) {
    var s       = document.createElement('style')
    s.id        = 'toastStyle'
    s.textContent = '@keyframes toastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}'
    document.head.appendChild(s)
  }

  document.body.appendChild(toast)
  setTimeout(function () {
    toast.style.opacity    = '0'
    toast.style.transition = 'opacity .4s'
    setTimeout(function () { toast.remove() }, 400)
  }, 2800)
}

// ============================================================
// 9. INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  initNavbar()
  initMobileMenu()
  initScrollReveal()
  initCounters()

  if (document.querySelector('.dashboard-layout')) {
    initDashboard()
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.querySelector(a.getAttribute('href'))
      if (target) {
        e.preventDefault()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })
})