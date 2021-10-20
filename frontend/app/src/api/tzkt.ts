import axios from 'axios';
import { AllOvenDatum, Baker, Block, CTezTzktStorage } from '../interfaces';
import { CTEZ_ADDRESS, CTEZ_CONTRACT_BIGMAP, TZKT_API, TZKT_PORT } from '../utils/globals';
import { getTzKtPort, getTzKtURL } from '../utils/settingUtils';

const get = async <T, P>(endpoint: string, queryParams?: P, userAddress?: string): Promise<T> => {
  let tzktUrl = TZKT_API;
  let tzktPort = TZKT_PORT;
  if (userAddress) {
    tzktUrl = getTzKtURL(userAddress) ?? TZKT_API;
    tzktPort = getTzKtPort(userAddress) ?? TZKT_PORT;
  }
  return (await axios.get(`${TZKT_API}:${TZKT_PORT}/v1/${endpoint}`, { params: queryParams })).data;
};

export const getDelegates = async (userAddress?: string): Promise<Baker[]> => {
  const data: string[][] = await get(
    'delegates?active=true&offset=0&limit=100&select.values=alias,address&sort.desc=stakingBalance',
    undefined,
    userAddress,
  );
  return data.map(([name, address]) => ({ name, address }));
};

export const getLastBlockOfTheDay = async (date: string, userAddress?: string): Promise<Block> => {
  const data: Block[] = await get(
    `blocks?timestamp.gt=${date}T00:00:00Z&timestamp.lt=${date}T23:59:59Z&sort.desc=level&limit=1`,
    undefined,
    userAddress,
  );
  return data[0];
};

export const getCTezTzktStorage = async (
  level?: number,
  userAddress?: string,
): Promise<CTezTzktStorage> => {
  const storage: CTezTzktStorage = await get(
    `contracts/${CTEZ_ADDRESS}/storage`,
    { level },
    userAddress,
  );
  return storage;
};

export const getAllOvensAPI = async (): Promise<AllOvenDatum[]> => {
  const data = await get<AllOvenDatum[], unknown>(`bigmaps/${CTEZ_CONTRACT_BIGMAP}/keys`);
  return data;
};

export const getUserOvenData = async (userAddress: string) => {
  try {
    const userOvenData: any = await axios.get(
      `https://api.granadanet.tzkt.io/v1/bigmaps/59943/keys?key.owner=${userAddress}`,
    );
    let tezInOvens: any = 0;
    let ctezOutstanding: any = 0;
    const userOvenDataLength: any = userOvenData.data.length;

    for (let i = 0; i < userOvenDataLength; ) {
      tezInOvens += Number(userOvenData.data[i].value.tez_balance) / 1e6;
      ctezOutstanding += Number(userOvenData.data[i].value.ctez_outstanding) / 1e6;
      i += 1;
    }
    return {
      tezInOvens,
      ctezOutstanding,
    };
  } catch (error) {
    return {
      tezInOvens: 0,
      ctezOutstanding: 0,
    };
  }
};
