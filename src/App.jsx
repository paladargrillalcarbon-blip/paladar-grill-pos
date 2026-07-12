import { Routes, Route } from 'react-router-dom';
import Sidebar from './layout/Sidebar.jsx';
import Topbar  from './layout/Topbar.jsx';
import { useAuthStore } from './store/authStore';
import Login from './modules/auth/Login.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

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
            <Route path="/"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/pos"        element={<ProtectedRoute><POS /></ProtectedRoute>} />
            <Route path="/orders"     element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/inventory"  element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
            <Route path="/menu"       element={<ProtectedRoute><Menu /></ProtectedRoute>} />
            <Route path="/recipes"    element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
            <Route path="/promotions" element={<ProtectedRoute><Promotions /></ProtectedRoute>} />
            <Route path="/staff"      element={<ProtectedRoute><Staff /></ProtectedRoute>} />
            <Route path="/finance"    element={<ProtectedRoute><Finance /></ProtectedRoute>} />
            <Route path="/suppliers"  element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
            <Route path="/purchases"  element={<ProtectedRoute><DailyPurchases /></ProtectedRoute>} />
            <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
