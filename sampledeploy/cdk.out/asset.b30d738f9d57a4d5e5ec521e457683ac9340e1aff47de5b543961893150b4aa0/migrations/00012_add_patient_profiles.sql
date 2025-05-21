-- Create patient_profiles table
create table if not exists public.patient_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  pronoun text,
  phone text,
  email text,
  contact_information jsonb,
  medical_record_number text,
  notes text, -- blob of text that adds details to the patient profile
  ai_context text, -- blob of text that adds details to ai note gen
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Add RLS policies for patient_profiles
alter table public.patient_profiles enable row level security;

create policy "Users can view their own patient profiles"
  on public.patient_profiles
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own patient profiles"
  on public.patient_profiles
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own patient profiles"
  on public.patient_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own patient profiles"
  on public.patient_profiles
  for delete
  using (auth.uid() = user_id);

-- Add patient_id to visits table
alter table public.visits
add column if not exists patient_id uuid references public.patient_profiles(id) on delete set null;

-- Create index for patient name search
create index if not exists idx_patient_profiles_name_search
on public.patient_profiles using gin(to_tsvector('english', name));

-- Create function for patient search
create or replace function public.search_patients(search_term text, user_id_param uuid)
returns table (
  id uuid,
  name text,
  medical_record_number text
)
language sql
security definer
set search_path = public
stable
as $$
  select 
    id,
    name,
    medical_record_number
  from public.patient_profiles
  where 
    user_id = user_id_param
    and (
      name ilike '%' || search_term || '%'
      or medical_record_number ilike '%' || search_term || '%'
    )
  order by 
    case when name ilike search_term || '%' then 0
         when name ilike '%' || search_term || '%' then 1
         else 2
    end,
    name
  limit 10;
$$; 