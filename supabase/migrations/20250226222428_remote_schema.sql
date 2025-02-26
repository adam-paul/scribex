create table "public"."user_profiles" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "username" text not null,
    "display_name" text,
    "level" integer not null default 1,
    "xp" integer not null default 0,
    "avatar_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."user_profiles" enable row level security;

CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id);

CREATE UNIQUE INDEX user_profiles_user_id_key ON public.user_profiles USING btree (user_id);

alter table "public"."user_profiles" add constraint "user_profiles_pkey" PRIMARY KEY using index "user_profiles_pkey";

alter table "public"."user_profiles" add constraint "user_profiles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_user_id_fkey";

alter table "public"."user_profiles" add constraint "user_profiles_user_id_key" UNIQUE using index "user_profiles_user_id_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

create or replace view "public"."leaderboard" as  SELECT up.user_id,
    up.username,
    up.display_name,
    up.level,
    up.xp,
    up.avatar_url,
    row_number() OVER (ORDER BY up.xp DESC) AS rank
   FROM user_profiles up;


grant delete on table "public"."user_profiles" to "anon";

grant insert on table "public"."user_profiles" to "anon";

grant references on table "public"."user_profiles" to "anon";

grant select on table "public"."user_profiles" to "anon";

grant trigger on table "public"."user_profiles" to "anon";

grant truncate on table "public"."user_profiles" to "anon";

grant update on table "public"."user_profiles" to "anon";

grant delete on table "public"."user_profiles" to "authenticated";

grant insert on table "public"."user_profiles" to "authenticated";

grant references on table "public"."user_profiles" to "authenticated";

grant select on table "public"."user_profiles" to "authenticated";

grant trigger on table "public"."user_profiles" to "authenticated";

grant truncate on table "public"."user_profiles" to "authenticated";

grant update on table "public"."user_profiles" to "authenticated";

grant delete on table "public"."user_profiles" to "service_role";

grant insert on table "public"."user_profiles" to "service_role";

grant references on table "public"."user_profiles" to "service_role";

grant select on table "public"."user_profiles" to "service_role";

grant trigger on table "public"."user_profiles" to "service_role";

grant truncate on table "public"."user_profiles" to "service_role";

grant update on table "public"."user_profiles" to "service_role";

create policy "Users can insert their own profile"
on "public"."user_profiles"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own profile"
on "public"."user_profiles"
as permissive
for update
to authenticated
using ((auth.uid() = user_id));


create policy "Users can view all profiles"
on "public"."user_profiles"
as permissive
for select
to authenticated
using (true);


create policy "Users can insert their own progress"
on "public"."user_progress"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can update their own progress"
on "public"."user_progress"
as permissive
for update
to authenticated
using ((auth.uid() = user_id));


create policy "Users can view their own progress"
on "public"."user_progress"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


