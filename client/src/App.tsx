import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Login from "./features/auth/login";
import Register from "./features/auth/register";
import { HomePage } from "./features/pages/home-page";
import { LandingPage } from "./features/pages/landing-page";
import ProtectedRoute from "./shared/⁠protectedRoutes";
import DataSources from "./features/pages/data-sources";
import { ApolloProvider } from "@apollo/client";
import client from "./graphql/apollo-client";

function App() {
  return (
    <Provider store={store}>
      <ApolloProvider client={client}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-sources"
              element={
                <ProtectedRoute>
                  <DataSources />
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </ApolloProvider>
    </Provider>
  );
}

export default App;