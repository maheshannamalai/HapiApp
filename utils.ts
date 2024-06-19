import { getAppDataSource } from "./AppDataSources";
import { Coupons } from "./entities/Coupons";
import { location } from ".";
import { LessThanOrEqual, MoreThanOrEqual } from "typeorm";

export async function findCouponByCodeAndDate(
  couponCode: string
): Promise<Coupons | undefined> {
  const couponRepository = getAppDataSource(location).getRepository(Coupons);
  const today = new Date();

  try {
    const coupon = await couponRepository.findOne({
      where: {
        uniqueCode: couponCode,
        startDate: MoreThanOrEqual(today),
        endDate: LessThanOrEqual(today),
        used: false,
      },
    });
    return coupon;
  } catch (error) {
    console.error("Error finding coupon:", error);
    return undefined;
  }
}
