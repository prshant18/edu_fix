
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://acojwavutkogtuvlpyjs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjb2p3YXZ1dGtvZ3R1dmxweWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1NjIzNzUsImV4cCI6MjA1ODEzODM3NX0.NWnBdenRn54NoNVvofociBHeYbYXtVNStVRnCsdwc-I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
