// ============================================
// JP Contracts | Conexão com Supabase
// js/supabase.js
// ============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://gvnfvmzlcqwoxzzhgebs.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bmZ2bXpsY3F3b3h6emhnZWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTIzNjYsImV4cCI6MjA4OTk4ODM2Nn0.KIOn1nFXeMhHHTDPfILPJuBHA8iKsZrBog6oz7PCyEs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)