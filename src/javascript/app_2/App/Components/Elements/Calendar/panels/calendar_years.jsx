import classNames         from 'classnames';
import React              from 'react';
import { toMoment }       from 'Utils/Date';
import CalendarPanelTypes from './types';

export const CalendarYears = ({ calendar_date, isPeriodDisabled, onClick, selected_date }) => {
    const selected_year = toMoment(selected_date).year();
    const moment_date   = toMoment(calendar_date);
    const current_year  = moment_date.year();
    const years         = [];
    for (let year = current_year - 1; year < current_year + 11; year++) {
        years.push(year);
    }
    return (
        <div className='calendar-year-panel'>
            {years.map((year, idx) => (
                <span
                    key={idx}
                    className={classNames('calendar-year', {
                        disabled: isPeriodDisabled(moment_date.year(year), 'year'),
                        active  : year === selected_year,
                    })}
                    onClick={onClick.year}
                    data-year={year}
                >
                    {year}
                </span>
            ))}
        </div>
    );
};

CalendarYears.propTypes = { ...CalendarPanelTypes };
