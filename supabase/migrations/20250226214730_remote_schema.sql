

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."user_progress" (
    "user_id" "uuid" NOT NULL,
    "progress_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_writing_projects" (
    "user_id" "uuid" NOT NULL,
    "projects_data" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_writing_projects" OWNER TO "postgres";


ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_writing_projects"
    ADD CONSTRAINT "user_writing_projects_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_user_progress_updated_at" ON "public"."user_progress" USING "btree" ("updated_at");



CREATE INDEX "idx_user_writing_projects_updated_at" ON "public"."user_writing_projects" USING "btree" ("updated_at");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_writing_projects"
    ADD CONSTRAINT "user_writing_projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can only access their own progress" ON "public"."user_progress" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can only access their own writing projects" ON "public"."user_writing_projects" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_writing_projects" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_writing_projects";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_writing_projects" TO "anon";
GRANT ALL ON TABLE "public"."user_writing_projects" TO "authenticated";
GRANT ALL ON TABLE "public"."user_writing_projects" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
