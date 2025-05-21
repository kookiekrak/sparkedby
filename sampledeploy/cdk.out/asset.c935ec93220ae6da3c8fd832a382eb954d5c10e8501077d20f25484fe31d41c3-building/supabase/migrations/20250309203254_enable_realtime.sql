-- Enable realtime for all tables
alter publication supabase_realtime add table visits;
alter publication supabase_realtime add table transcripts;
alter publication supabase_realtime add table containers;
alter publication supabase_realtime add table notes;
alter publication supabase_realtime add table user_profiles;
alter publication supabase_realtime add table patient_profiles;

NOTIFY pgrst, 'reload schema';