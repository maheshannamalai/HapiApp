function calculateShippingCost(weight, distance) {
  const rate = 0.5;
  const cost = weight * distance * rate;
  return cost;
}

const weight = 5;
const distance = 100;
const shippingCost = calculateShippingCost(weight, distance);

// ---------------------------------------------------------------------------------//

interface ShippingParams {
  weight: number;
  distance: number;
}

type ShippingCost = number;

function calculateShippingCostTS({
  weight,
  distance,
}: ShippingParams): ShippingCost {
  const rate: number = 0.5;
  const cost: ShippingCost = weight * distance * rate;
  return cost;
}
