<<<<<<< HEAD
mutation{
  registerUser(user:{email:"testDatasource@test.com" , password: "admiin1234"}){
    user {
      id
      email
    }
    projectIds {
      id
      database
      type
      projectId
    }
    collections
  }
=======
# Direct connection to the database. Used for migrations

DIRECT_URL="postgresql://postgres.tchkarrwxtjmbmpkabqt:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# the command to set database

- psql -d "postgres://postgres.tchkarrwxtjmbmpkabqt:Visual.ai1234@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" -f netflix_shows.sql
- psql -d "postgres://postgres.tchkarrwxtjmbmpkabqt:Visual.ai1234@aws-0-eu-central-1.pooler.supabase.com:5432/postgres" -f titanic.sql

mutation{
registerUser(user:{email:"david@test.com" , password: "admiin1234"}){
user {
id
email
}
projectIds {
id
database
type
projectId
}
collections
}
>>>>>>> 527d5a75438dfe8dd7cd0ab2de67dff47ec1580a
}


mutation{
<<<<<<< HEAD
  loginUser(email:"testDatasource@test.com" , password: "admiin1234"){
    user {
      id
      email
    }
    projectIds {
      id
      database
      type
      projectId
    }
    collections
  }
=======
loginUser(email:"david@test.com" , password: "admiin1234"){
user {
id
email
}
projectIds {
id
database
type
projectId
}
collections
}
>>>>>>> 527d5a75438dfe8dd7cd0ab2de67dff47ec1580a
}

query {
checkCurrentUser {
user {
id
email
}
projectIds {
id
database
type
projectId
}
collections
}
}

mutation{
logout {
message
}
}
<<<<<<< HEAD
}



mutation{
  checkPostgresqlConnection(datasource: {
    userId: "7b419536-5a3b-4230-b133-d67bf7f23a41",
    databaseUrl: "aws-0-eu-central-1.pooler.supabase.com",
    username: "postgres.tchkarrwxtjmbmpkabqt",
    password: "Visual.ai1234",
    port: "5432",
    databaseName: "postgres"
  }) {
    message
  }
}

mutation{
  createPostgresqlDataSource(source:{
    userId: "7b419536-5a3b-4230-b133-d67bf7f23a41",
    projectId: "testDataSource",
    databaseUrl: "YXdzLTAtZXUtY2VudHJhbC0xLnBvb2xlci5zdXBhYmFzZS5jb20=",
    username: "postgres.tchkarrwxtjmbmpkabqt",
    password: "VmlzdWFsLmFpMTIzNA==",
    port: "5432",
    databaseName: "cG9zdGdyZXM="
  }) {
    dataSource {
      id
      database
      projectId
      type
    }
  }
}

query{
  getDataSources {
    dataSource {
      id
      database
      projectId
      type
    }
  }
}

query{
  executePostgreSQLQuery(data:  {
     projectId:"testDataSource",
     sqlQuery:"SELECT * FROM netflix_shows LIMIT 10"    
  }) {
    documents
  }
}

query{
  getPostgreSQLCollections(projectId:"testDataSource") {
    collections
    projectIds {
      id
      database
      projectId
      type
    }
  }
}

mutation {
  createChart(input: {
    name: "Example Chart"
    type: "bar"
    data: [1.1, 2.2, 3.3]
  }) {
    id
    name
    type
    data
  }
}
=======
>>>>>>> 527d5a75438dfe8dd7cd0ab2de67dff47ec1580a
