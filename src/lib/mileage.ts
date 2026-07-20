export const IRS_MILEAGE_RATE_CENTS = 76;

export function milesToTimes100(miles: number) {
  return Math.round(miles * 100);
}

export function times100ToMiles(milesTimes100: number) {
  return milesTimes100 / 100;
}

export function mileageReimbursementCents(milesTimes100: number) {
  const miles = times100ToMiles(milesTimes100);
  return Math.round(miles * IRS_MILEAGE_RATE_CENTS);
}

type MileageTripRecord = {
  id: string;
  userId: string;
  milesTimes100: number;
  tripDate: Date;
  purpose: string | null;
  note: string | null;
  isReimbursed: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeMileageTrip(trip: MileageTripRecord) {
  const reimbursementCents = mileageReimbursementCents(trip.milesTimes100);

  return {
    ...trip,
    tripDate: trip.tripDate.toISOString(),
    createdAt: trip.createdAt.toISOString(),
    updatedAt: trip.updatedAt.toISOString(),
    miles: times100ToMiles(trip.milesTimes100),
    reimbursementCents,
    reimbursement: reimbursementCents / 100,
  };
}
