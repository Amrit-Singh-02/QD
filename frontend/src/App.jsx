//Hello
import {Toaster} from 'react-hot-toast';
import Registration from './component/Auth/Registration';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Cart from './pages/Cart';
import ProductDetails from './pages/ProductDetails';
import Login from './component/Auth/Login';
import VerifyEmail from './component/Auth/VerifyEmail';
import VerificationPending from './component/Auth/VerificationPending';
import ResendVerification from './component/Auth/ResendVerification';
import ForgotPassword from './component/Auth/ForgotPassword';
import ResetPassword from './component/Auth/ResetPassword';
import MyProfile from './pages/MyProfile';
import MyOrders from './pages/MyOrders';
import MyAddresses from './pages/MyAddresses';
import OrderSuccess from './pages/OrderSuccess';
import OrderDetails from './pages/OrderDetails';
import AdminAddProduct from './pages/AdminAddProduct';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminCreateDeliveryAgent from './pages/AdminCreateDeliveryAgent';
import DeliveryDashboard from './pages/DeliveryDashboard';
import HelpDesk from './pages/HelpDesk';
import AdminHelpTickets from './pages/AdminHelpTickets';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './context/AuthContext';

const DeliveryGate = ({ children }) => {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-blinkit-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blinkit-green" />
      </div>
    );
  }

  if (user?.role === "delivery" && !location.pathname.startsWith("/delivery")) {
    return <Navigate to="/delivery/dashboard" replace />;
  }

  return children;
};

function App() {

  return (
    <>
     <Toaster position='top-right'/>
     <DeliveryGate>
       <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/cart" element={<Cart/>} />
          <Route path="/product/:id" element={<ProductDetails/>} />
          <Route path="/register" element={<Registration/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/verification-pending" element={<VerificationPending/>} />

          <Route path="/verify-email/:emailToken" element={<VerifyEmail/>} />
          <Route path="/resend-verification" element={<ResendVerification/>} />
          <Route path="/forgot-password" element={<ForgotPassword/>} />
          <Route path="/reset-password/:passwordToken" element={<ResetPassword/>} />
          
          {/* User Profile Routes */}
          <Route path="/profile" element={<MyProfile/>} />
          <Route path="/orders" element={<MyOrders/>} />
          <Route path="/addresses" element={<MyAddresses/>} />
          <Route path="/help" element={<HelpDesk/>} />
          <Route path="/order-success" element={<OrderSuccess/>} />
          <Route path="/order/:id" element={<OrderDetails/>} />

          {/* Admin Routes */}
          <Route path="/admin/products" element={<AdminProducts/>} />
          <Route path="/admin/dashboard" element={<AdminDashboard/>} />
          <Route path="/admin/products/new" element={<AdminAddProduct/>} />
          <Route path="/admin/orders" element={<AdminOrders/>} />
          <Route path="/admin/help-tickets" element={<AdminHelpTickets/>} />
          <Route path="/admin/delivery-agent/new" element={<AdminCreateDeliveryAgent/>} />
          <Route path="/delivery/dashboard" element={<DeliveryDashboard/>} />
          
        


          <Route path="*" element={<div>404- Page not Found!</div>} />
       </Routes>
     </DeliveryGate>
    </>
  )
}

export default App
