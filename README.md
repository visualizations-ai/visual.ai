# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.tchkarrwxtjmbmpkabqt:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# the command to set database 
- psql -d "postgres://postgres.tchkarrwxtjmbmpkabqt:Visual.ai1234@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" -f netflix_shows.sql
- psql -d "postgres://postgres.tchkarrwxtjmbmpkabqt:Visual.ai1234@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" -f titanic.sql