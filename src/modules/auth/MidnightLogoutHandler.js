import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Logs the signed-in customer out at the next midnight (local time).
 *
 * The previous version compared new Date().getDate() against a ref that was
 * reset on every effect re-run, so a re-render just after midnight made the
 * check pass as "same day" and the logout never fired. This version locks in a
 * single midnight *timestamp* and simply checks whether the clock has reached
 * it — reliable across re-renders, and across tab sleep/wake because a 30s
 * interval re-checks the real time (not just a one-shot timer).
 */
const MidnightLogoutHandler = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const targetRef = useRef(null);

  useEffect(() => {
    if (!user) {
      targetRef.current = null;
      return undefined;
    }

    // Lock in the upcoming midnight ONCE. Do not recompute it on later re-runs,
    // otherwise a re-render right after midnight would push the target to the
    // next day and skip the logout.
    if (targetRef.current == null) {
      const next = new Date();
      next.setHours(24, 0, 0, 0); // start of the next local day
      targetRef.current = next.getTime();
    }

    const check = () => {
      if (targetRef.current != null && Date.now() >= targetRef.current) {
        targetRef.current = null;
        logout();
        navigate('/login');
      }
    };

    // Precise one-shot at the target, plus a safety poll (covers sleep/wake and
    // any timer throttling while the tab is in the background).
    const timeoutId = setTimeout(check, Math.max(0, targetRef.current - Date.now()) + 500);
    const intervalId = setInterval(check, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [user, logout, navigate]);

  return null;
};

export default MidnightLogoutHandler;
