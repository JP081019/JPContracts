// ============================================
// JP Contracts | Mercado Pago
// js/mercadopago.js
// ============================================

const MP_PUBLIC_KEY = 'TEST-aab79189-7294-437d-bd38-df9a84e37c72'

// Planos disponíveis
const PLANOS = {
  basico: {
    id:          'basico',
    nome:        'Plano Básico',
    preco:       97.00,
    descricao:   'Até 30 contratos, alertas por email, suporte por chat'
  },
  pro: {
    id:          'pro',
    nome:        'Plano Pro',
    preco:       197.00,
    descricao:   'Contratos ilimitados, alertas email + WhatsApp, relatórios'
  },
  premium: {
    id:          'premium',
    nome:        'Plano Premium',
    preco:       397.00,
    descricao:   'Tudo do Pro + suporte 24/7, usuários ilimitados'
  }
}