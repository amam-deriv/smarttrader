import extend                  from 'extend';
import { WS }                  from 'Services';
import { MARKER_TYPES_CONFIG } from '../../SmartChart/Constants/markers';

export const createChartMarkers = (SmartChartStore, contract_info, ContractStore = null) => {
    if (contract_info) {
        Object.keys(marker_creators).forEach((marker_type) => {
            if (marker_type in SmartChartStore.markers) return;

            const marker_config = marker_creators[marker_type](contract_info, ContractStore);
            if (marker_config) {
                SmartChartStore.createMarker(marker_config);
            }
        });
        const init = getTicksBetweenStartAndEnd(ContractStore, SmartChartStore);
        init(contract_info);
    }
};

const getTicksBetweenStartAndEnd = function(ContractStore, SmartChartStore) {
    let has_been_called = false;
    const zip = rows => rows[0].map((_,c) => rows.map(row => row[c]));
    const combinePriceTime = (price_arr, times_arr) =>
        zip([ price_arr, times_arr ]).reduce((acc, curr) => [...acc, { price: +curr[0], time: +curr[1] }], []);

    return function ({ ...contract_info }) {
        if (has_been_called) return;
        has_been_called = true;

        const ticks_history_req = {
            ticks_history: contract_info.underlying,
            start        : contract_info.entry_tick_time,
            end          : ContractStore.end_spot_time ? ContractStore.end_spot_time : 'latest',
            count        : contract_info.tick_count,
        };

        if (ContractStore.end_spot_time) {
            WS.sendRequest(ticks_history_req).then((data) => {
                const { prices, times } = data.history;
                const middle_ticks = combinePriceTime(prices, times)
                    .filter((i) => i.time > +contract_info.entry_tick_time && i.time < +ContractStore.end_spot_time);

                middle_ticks.forEach((tick) => {
                    const marker_config = createMarkerSpotMiddle(tick, 'add');
                    SmartChartStore.createMarker(marker_config);
                });

                console.log(middle_ticks);
                // TODO: add middle ticks to chart

            });
        } else {
            WS.subscribeTicksHistory({ ...ticks_history_req, subscribe: 1 }, (data) => {
                console.log('createChartMarker: ', data);
            });
        }
    };
};

const marker_creators = {
    [MARKER_TYPES_CONFIG.LINE_END.type]     : createMarkerEndTime,
    [MARKER_TYPES_CONFIG.LINE_PURCHASE.type]: createMarkerPurchaseTime,
    [MARKER_TYPES_CONFIG.LINE_START.type]   : createMarkerStartTime,
    [MARKER_TYPES_CONFIG.SPOT_ENTRY.type]   : createMarkerSpotEntry,
    [MARKER_TYPES_CONFIG.SPOT_EXIT.type]    : createMarkerSpotExit,
};

// -------------------- Lines --------------------
function createMarkerEndTime(contract_info) {
    if (contract_info.status === 'open' || !contract_info.date_expiry) return false;

    return createMarkerConfig(
        MARKER_TYPES_CONFIG.LINE_END.type,
        contract_info.date_expiry,
    );
}

function createMarkerPurchaseTime(contract_info) {
    if (!contract_info.purchase_time || !contract_info.date_start ||
        +contract_info.purchase_time === +contract_info.date_start) return false;

    return createMarkerConfig(
        MARKER_TYPES_CONFIG.LINE_PURCHASE.type,
        contract_info.purchase_time,
    );
}

function createMarkerStartTime(contract_info) {
    if (!contract_info.date_start) return false;

    return createMarkerConfig(
        MARKER_TYPES_CONFIG.LINE_START.type,
        contract_info.date_start,
    );
}

// -------------------- Spots --------------------
function createMarkerSpotEntry(contract_info, ContractStore) {
    if (!contract_info.entry_tick_time || ContractStore.is_sold_before_start) return false;

    return createMarkerConfig(
        MARKER_TYPES_CONFIG.SPOT_ENTRY.type,
        contract_info.entry_tick_time,
        contract_info.entry_tick,
        {
            // spot_value: `${contract_info.entry_tick}`,
        },
    );
}

function createMarkerSpotExit(contract_info, ContractStore) {
    if (!ContractStore.end_spot_time) return false;

    return createMarkerConfig(
        MARKER_TYPES_CONFIG.SPOT_EXIT.type,
        ContractStore.end_spot_time,
        ContractStore.end_spot,
        {
            spot_value: `${ContractStore.end_spot}`,
            status    : `${contract_info.profit > 0 ? 'won' : 'lost' }`,
        },
    );
}

function createMarkerSpotMiddle(tick, should_add) {
    // TODO: createMarkerConfig for middle spots
    if (should_add !== 'add') return false;

    return createMarkerConfig(
        MARKER_TYPES_CONFIG.SPOT_MIDDLE.type,
        tick.time,
        tick.price,
        {
            spot_value: `${tick.price}`,
            // status    : `${tick.price > 0 ? 'won' : 'lost' }`,
        },
    );
}

// -------------------- Helpers --------------------
const createMarkerConfig = (marker_type, x, y, content_config) => (
    extend(true, {}, MARKER_TYPES_CONFIG[marker_type], {
        marker_config: {
            x: +x,
            y,
        },
        content_config,
    })
);
