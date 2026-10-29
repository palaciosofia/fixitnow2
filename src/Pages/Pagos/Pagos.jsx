// src/Pages/Pagos/Pagos.jsx
import { useAuth } from "../../context/AuthProvider";
import ClientPayments from "../../Components/ClientPayments";
import { Button, EmptyState, PageHeader } from "../../ui";
import { Wallet } from "lucide-react";

export default function Pagos() {
  const { user, isCliente, isTecnico } = useAuth();

  if (!isCliente) {
    return (
      <EmptyState
        icon={Wallet}
        title="Los pagos de técnico están en tu panel"
        text="Ahí ves los pagos que te reportan los clientes y los confirmas."
        action={isTecnico && <Button to="/mi-perfil?tab=pagos">Ir a mis pagos</Button>}
      />
    );
  }

  return (
    <div>
      <PageHeader title="Pagos" subtitle="Reporta y revisa los pagos de tus reservas" />
      <ClientPayments uid={user.uid} />
    </div>
  );
}
