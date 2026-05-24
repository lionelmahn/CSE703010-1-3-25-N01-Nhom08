import { useEffect, useState } from 'react';

import { onlineBookingApi } from '@/api/onlineBookingApi';
import {
    BOOKING_SERVICES,
    CLINIC_BRANCHES,
    TIME_SLOTS,
} from '@/features/online-booking/data';

let cache = null;
let inflight = null;

const unwrapData = (payload, fallback) => {
    const items = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
            ? payload
            : [];
    return items.length > 0 ? items : fallback;
};

const fetchCatalogs = async () => {
    if (cache) return cache;
    if (inflight) return inflight;

    inflight = Promise.all([
        onlineBookingApi.getServices().catch(() => BOOKING_SERVICES),
        onlineBookingApi.getBranches().catch(() => CLINIC_BRANCHES),
        onlineBookingApi.getTimeSlots().catch(() => TIME_SLOTS),
    ]).then(([servicesPayload, branchesPayload, slotsPayload]) => {
        cache = {
            services: unwrapData(servicesPayload, BOOKING_SERVICES),
            branches: unwrapData(branchesPayload, CLINIC_BRANCHES),
            timeSlots: unwrapData(slotsPayload, TIME_SLOTS),
        };
        return cache;
    }).finally(() => {
        inflight = null;
    });

    return inflight;
};

export const useOnlineBookingCatalogs = () => {
    const [catalogs, setCatalogs] = useState(cache || {
        services: BOOKING_SERVICES,
        branches: CLINIC_BRANCHES,
        timeSlots: TIME_SLOTS,
    });

    useEffect(() => {
        let alive = true;
        fetchCatalogs().then((next) => {
            if (alive) setCatalogs(next);
        });
        return () => {
            alive = false;
        };
    }, []);

    return catalogs;
};

export default useOnlineBookingCatalogs;
