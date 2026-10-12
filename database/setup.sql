-- Run once in Supabase SQL Editor. All café tables are namespaced.
CREATE TABLE public.cafe_employees (id text PRIMARY KEY,name text NOT NULL,role text NOT NULL,basis text NOT NULL CHECK (basis IN ('daily','hourly')),rate double precision NOT NULL CHECK (rate >= 0),start text NOT NULL,active smallint NOT NULL DEFAULT 1,"loginEmail" text UNIQUE,"authUserId" text UNIQUE);
CREATE TABLE public.cafe_shifts (id text PRIMARY KEY,name text NOT NULL,start text NOT NULL,"end" text NOT NULL);
CREATE TABLE public.cafe_attendance (id text PRIMARY KEY,employee text NOT NULL REFERENCES public.cafe_employees(id),day text NOT NULL,"clockIn" text NOT NULL,"clockOut" text,shift text NOT NULL,photo text NOT NULL,rate double precision NOT NULL,basis text NOT NULL,UNIQUE(employee,day));
CREATE TABLE public.cafe_payments (id text PRIMARY KEY,employee text NOT NULL REFERENCES public.cafe_employees(id),start text NOT NULL,"end" text NOT NULL,amount double precision NOT NULL,days integer NOT NULL,hours double precision NOT NULL,currency text NOT NULL,"paidAt" text NOT NULL,note text NOT NULL,snapshot text NOT NULL,UNIQUE(employee,start));
CREATE TABLE public.cafe_settings (key text PRIMARY KEY,value text NOT NULL);
ALTER TABLE public.cafe_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cafe_employees,public.cafe_shifts,public.cafe_attendance,public.cafe_payments,public.cafe_settings FROM anon,authenticated;
GRANT ALL ON public.cafe_employees,public.cafe_shifts,public.cafe_attendance,public.cafe_payments,public.cafe_settings TO service_role;
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types) VALUES ('cafe-attendance-selfies','cafe-attendance-selfies',false,4194304,ARRAY['image/jpeg','image/png','image/webp']);
