export function isValidCPF(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split('').map(Number);
  const calculateCheckDigit = (length: number) => {
    const sum = digits
      .slice(0, length)
      .reduce((total, digit, index) => total + digit * (length + 1 - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return (
    calculateCheckDigit(9) === digits[9] &&
    calculateCheckDigit(10) === digits[10]
  );
}
