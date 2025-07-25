import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import Login from "./features/auth/login";
import Register from "./features/auth/register";
import { HomePage } from "./features/pages/home-page";
import ChartsDashboard from "./features/pages/charts-dashboard";
import { LandingPage } from "./features/pages/landing-page";
import PurchaseRecommendations from "./features/pages/purchase-recommendations";
import ProtectedRoute from "./shared/⁠protectedRoutes";
import DataSources from "./features/pages/data-sources";
import SqlEditor from "./features/pages/sql-editor";
import { ApolloProvider } from "@apollo/client";
import client from "./graphql/apollo-client";
import { ToastProvider } from "./shared/ToastContext";

function App() {
  return (
    <Provider store={store}>
      <ApolloProvider client={client}>
        <ToastProvider>
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
              <Route
                path="/sql-editor"
                element={
                  <ProtectedRoute>
                    <SqlEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/charts"
                element={
                  <ProtectedRoute>
                    <ChartsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/purchase-recommendations"
                element={
                  <ProtectedRoute>
                    <PurchaseRecommendations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forecasts"
                element={
                  <ProtectedRoute>
                    <div className="p-8 text-center">
                      <h1 className="text-2xl font-bold text-gray-800">Forecasts</h1>
                      <p className="text-gray-600 mt-2">Coming soon...</p>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </ApolloProvider>
    </Provider>
  );
}

export default App;