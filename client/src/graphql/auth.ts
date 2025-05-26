import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation LoginUser($email: String!, $password: String!) {
    loginUser(email: $email, password: $password) {
      user {
        id
        email
      }
      projectIds {
        id
        projectId
        type
        database
      }
      collections
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation RegisterUser($user: Auth!) {
    registerUser(user: $user) {
      user {
        id
        email
      }
      projectIds {
        id
        projectId
        type
        database
      }
      collections
    }
  }
`;

export const CHECK_CURRENT_USER = gql`
  query CheckCurrentUser {
    checkCurrentUser {
      user {
        id
        email
      }
      projectIds {
        id
        projectId
        type
        database
      }
      collections
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout {
      message
    }
  }
`;