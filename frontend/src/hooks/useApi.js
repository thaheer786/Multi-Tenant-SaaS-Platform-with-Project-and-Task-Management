import { useCallback, useState } from 'react';

export const useApi = (apiFunction) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFunction(...args);
        if (response.data.success) {
          setData(response.data.data);
          return response.data.data;
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  return { data, loading, error, execute };
};
