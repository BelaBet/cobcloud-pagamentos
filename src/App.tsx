import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import Payments from "./pages/Payments";
import PaymentGenerated from "./pages/PaymentGenerated";
import Transactions from "./pages/Transactions";
import Sellers from "./pages/Sellers";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/payments" replace />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/payments/generated" element={<PaymentGenerated />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/sellers" element={<Sellers />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}