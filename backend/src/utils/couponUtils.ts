// 📁 kafka-coupon/src/utils/couponUtils.ts

import dayjs from 'dayjs';

export const isCouponAvailable = (startTime: string): boolean => {
  const now = dayjs();
  return now.isAfter(dayjs(startTime));
};
