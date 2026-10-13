alter table public.blocks
  add constraint blocks_note_length check (char_length(note) <= 2000);