import { useCallback, useState } from 'react';
import { receptionApi } from '@/api/receptionApi';

/**
 * UC11 - Mutate check-in / cancel-checkin / no-show.
 *
 * Tra ve { checkIn, cancelCheckIn, markNoShow, loading, error } voi flag
 * loading rieng cho moi action de UI khoa nut tuong ung.
 */
export const useCheckInActions = ({ onSuccess } = {}) => {
  const [loadingAction, setLoadingAction] = useState(null);
  const [error, setError] = useState(null);

  const runAction = useCallback(
    async (action, fn) => {
      setLoadingAction(action);
      setError(null);
      try {
        const res = await fn();
        if (onSuccess) {
          await onSuccess(action, res);
        }
        return res;
      } catch (err) {
        const msg = err?.response?.data?.message
          || Object.values(err?.response?.data?.errors || {}).flat().join('; ')
          || err?.message
          || 'Thao tac that bai.';
        setError(msg);
        throw err;
      } finally {
        setLoadingAction(null);
      }
    },
    [onSuccess],
  );

  const checkIn = useCallback(
    (appointmentId, payload = {}) =>
      runAction('check_in', () => receptionApi.checkIn(appointmentId, payload)),
    [runAction],
  );

  const cancelCheckIn = useCallback(
    (appointmentId, payload) =>
      runAction('cancel_check_in', () => receptionApi.cancelCheckIn(appointmentId, payload)),
    [runAction],
  );

  const markNoShow = useCallback(
    (appointmentId, payload) =>
      runAction('no_show', () => receptionApi.markNoShow(appointmentId, payload)),
    [runAction],
  );

  return {
    checkIn,
    cancelCheckIn,
    markNoShow,
    loadingAction,
    error,
    setError,
  };
};

export default useCheckInActions;
