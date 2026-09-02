import { Routes, Route } from 'react-router-dom';
import Sidebar from './layout/Sidebar.jsx';
import Topbar  from './layout/Topbar.jsx';
import { useAuthStore } from './store/authStore';
import Login from './modules/auth/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Módulos
import Dashboard  from './modules/dashboard/Dashboard.jsx';
import POS        from './modules/pos/POS.jsx';
import Orders     from './modules/orders/Orders.jsx';
import Inventory  from './modules/inventory/Inventory.jsx';
import Menu       from './modules/menu/Menu.jsx';
import Recipes    from './modules/recipes/Recipes.jsx';
import Promotions from './modules/promotions/Promotions.jsx';
import Staff      from './modules/staff/Staff.jsx';
import Finance    from './modules/finance/Finance.jsx';
import Suppliers  from './modules/suppliers/Suppliers.jsx';
import DailyPurchases from './modules/purchases/DailyPurchases.jsx';
import Settings   from './modules/settings/Settings.jsx';
import Loyalty    from './modules/loyalty/Loyalty.jsx';

export default function App() {
  const { activeUser } = useAuthStore();

  if (!activeUser) {
    return <Login />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-container">
          <Routes>
            <Route path="/"           element={<ErrorBoundary><ProtectedRoute><Dashboard /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/pos"        element={<ErrorBoundary><ProtectedRoute><POS /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/orders"     element={<ErrorBoundary><ProtectedRoute><Orders /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/inventory"  element={<ErrorBoundary><ProtectedRoute><Inventory /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/menu"       element={<ErrorBoundary><ProtectedRoute><Menu /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/recipes"    element={<ErrorBoundary><ProtectedRoute><Recipes /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/promotions" element={<ErrorBoundary><ProtectedRoute><Promotions /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/staff"      element={<ErrorBoundary><ProtectedRoute><Staff /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/finance"    element={<ErrorBoundary><ProtectedRoute><Finance /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/suppliers"  element={<ErrorBoundary><ProtectedRoute><Suppliers /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/purchases"  element={<ErrorBoundary><ProtectedRoute><DailyPurchases /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/settings"   element={<ErrorBoundary><ProtectedRoute><Settings /></ProtectedRoute></ErrorBoundary>} />
            <Route path="/loyalty"    element={<ErrorBoundary><ProtectedRoute><Loyalty /></ProtectedRoute></ErrorBoundary>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
