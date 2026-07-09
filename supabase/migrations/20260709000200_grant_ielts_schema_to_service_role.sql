grant usage on schema ielts to service_role;
grant execute on function ielts.is_admin() to service_role;
grant select, insert, update, delete on all tables in schema ielts to service_role;
alter default privileges in schema ielts grant select, insert, update, delete on tables to service_role;
