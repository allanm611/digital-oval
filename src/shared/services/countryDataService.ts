import countriesAndCurrenciesData from '../data/countriesAndCurrencies.json';

interface CountryData {
  name: string;
  code: string;
  flag: string;
  currency: string;
}

interface CurrencyData {
  code: string;
  name: string;
}

const countriesData: CountryData[] = countriesAndCurrenciesData.countries;
const currenciesData: CurrencyData[] = countriesAndCurrenciesData.currencies;

// Replaces world-countries library
export const getCountriesList = () => {
  return countriesData
    .map((country) => ({
      name: country.name,
      code: country.code,
      flag: country.flag,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Replaces currency-codes library
export const getCurrenciesList = () => {
  return currenciesData
    .map((currency) => ({
      code: currency.code,
      name: currency.name,
    }))
    .sort((a, b) => a.code.localeCompare(b.code));
};

// Get currency code by country code
export const getCurrencyByCountryCode = (countryCode: string): string | undefined => {
  const country = countriesData.find((c) => c.code === countryCode);
  return country?.currency;
};

// Get country by code
export const getCountryByCode = (code: string): CountryData | undefined => {
  return countriesData.find((c) => c.code === code);
};

// Get currency by code
export const getCurrencyByCode = (code: string): CurrencyData | undefined => {
  return currenciesData.find((c) => c.code === code);
};
