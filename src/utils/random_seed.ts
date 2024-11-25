export const randomSeed = (): string => {
  let seed = "";
  const length = 14;
  const numbers = "0123456789";
  for (let i = 0; i < length; i++) {
    seed += numbers[Math.floor(Math.random() * numbers.length)];
  }
  return seed;
};
