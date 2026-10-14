export function paymentBonus(amount: unknown, reason: unknown) {
  const value = amount === undefined ? 0 : amount;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1_000_000_000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.00001) {
    throw Error('Enter a bonus between 0 and 1,000,000,000, with at most two decimal places.');
  }
  if (reason !== undefined && typeof reason !== 'string') throw Error('Enter a valid bonus reason.');
  const note = (reason as string | undefined || '').trim();
  if (note.length > 300 || (value > 0 && !note)) throw Error('Enter a bonus reason of up to 300 characters.');
  return { amount: value, reason: value > 0 ? note : '' };
}
