import { CheckoutHeader } from "@/components/CheckoutHeader";
import { OrderCompletePage } from "@/features/orders/OrderCompletePage";

export default async function OrderCompleteRoute({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <>
      <CheckoutHeader />
      <OrderCompletePage orderId={orderId} />
    </>
  );
}
